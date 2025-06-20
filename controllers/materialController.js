const Material = require('../models/Material');
const Course = require('../models/Course');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // تأكد من إعداد مسار التخزين الصحيح

// ✅ رفع ملف PDF/ZIP
exports.uploadMaterial = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: '❌ الكورس غير موجود' });

    // السماح فقط للإنستراكتور صاحب الكورس أو الأدمن
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: '❌ غير مصرح لك برفع ملفات لهذا الكورس' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '❌ يجب رفع ملف' });
    }

    const material = await Material.create({
      courseId,
      filePath: req.file.path,
      fileType: req.file.mimetype,
    });

    res.status(201).json({ message: '✅ تم رفع الملف بنجاح', material });
  } catch (error) {
    console.error('❌ Error uploading material:', error);
    res.status(500).json({ message: '❌ فشل في رفع الملف', error: error.message });
  }
};

// ✅ عرض الملفات المرتبطة بكورس معين
exports.getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;

    const materials = await Material.find({ courseId });

    if (!materials || materials.length === 0) {
      return res.status(404).json({ message: '❌ لا توجد ملفات لهذا الكورس' });
    }

    res.status(200).json({ message: '✅ تم جلب الملفات بنجاح', materials });
  } catch (error) {
    console.error('❌ Error fetching materials:', error);
    res.status(500).json({ message: '❌ فشل في جلب الملفات', error: error.message });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ message: '❌ المادة غير موجودة' });
    }

    // السماح فقط للإنستراكتور صاحب الكورس أو الأدمن
    const course = await Course.findById(material.courseId);
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: '❌ غير مصرح لك بحذف هذه المادة' });
    }

    await material.deleteOne();
    res.status(200).json({ message: '✅ تم حذف المادة بنجاح' });
  } catch (err) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء الحذف', error: err.message });
  }
};