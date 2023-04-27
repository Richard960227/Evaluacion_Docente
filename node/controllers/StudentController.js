import StudentModel from '../models/StudentModel.js';
import xlsx from 'xlsx';
import fs from 'fs';


export const getAllStudents = async (req, res) => {
    try {
        const students = await StudentModel.find();
        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getStudent = async (req, res) => {
    const { id } = req.params.id;

    try {
        const student = await StudentModel.findById(id);
        if (user) {
            res.status(200).json(student);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createStudent = async (req, res) => {
    const newStudent = new StudentModel(req.body);

    try {
        const savedStudent = await newStudent.save();
        res.status(200).json(savedStudent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal serever error' });
    }
};

export const updateStudent = async (req, res) => {
    const { id } = req.params;

    try {
        const updatedStudent = await StudentModel.findByIdAndUpdate(
            id,
            req.body,
            { new: true, }
        );
        if (updatedStudent) {
            res.status(200).json(updatedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteStudent = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedStudent = await StudentModel.findByIdAndDelete(id);
        if (deletedStudent) {
            res.json({ message: 'Estudiante eliminado' });
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteAllStudents = async (req, res) => {
    try {
        const result = await StudentModel.deleteMany({});
        res.json({ message: `${result.deletedCount} estudiantes eliminados` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const validationRules = {
    CAMPUS: { required: true },
    NIVEL: { required: true },
    PARTE_PERIODO: { required: true },
    CRN: { required: true, numeric: true },
    CLAVE_MATERIA: { required: true },
    MATERIA: { required: true },
    SOCIO_INTEG: { required: true },
    PERIODO: { required: true, numeric: true },
    BLOQUE: { required: true },
    MATRICULA: { required: true, numeric: true },
    ALUMNO: { required: true },
    ESTATUS: { required: true },
    TIPO_ALUMNO: { required: true },
    CLAVE_PROGRAMA: { required: true },
    PROGRAMA: { required: true },
    DOCENTE: { required: true },
    CORREO_PREF: { required: true },
};

const sanitize = (data) => {
    return data.map((item) => {
        return Object.entries(item).reduce((acc, [key, value]) => {
            acc[key] = typeof value === 'string' ? value.trim() : value;
            return acc;
        }, {});
    });
};

export const uploadFileStudents = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }
        if (!file.originalname.endsWith('.xlsx')) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        const workbook = xlsx.read(fs.readFileSync(file.path));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        fs.unlinkSync(req.file.path);

        const sanitizedData = sanitize(data);

        const validData = sanitizedData.filter((item) => {
            return Object.entries(validationRules).every(([key, rules]) => {
                const value = item[key];
                if (rules.required && !value) {
                    return false;
                }
                if (rules.numeric && isNaN(value)) {
                    return false;
                }
                return true;
            });
        });

        const uniqueData = validData.filter((item, index, arr) => {
            return index === arr.findIndex((i) => i.MATRICULA === item.MATRICULA);
        });

        const savedStudents = await StudentModel.create(uniqueData);

        res.status(201).json({ message: 'File uploaded and students created', students: savedStudents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
