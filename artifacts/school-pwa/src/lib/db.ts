import { openDB, DBSchema, IDBPDatabase } from 'idb';

const uuidv4 = () => crypto.randomUUID();

export interface FeeRecord {
  id: string;
  studentId: string;
  classId: string;
  type: string;
  description: string;
  amount: number;
  amountPaid: number;
  session: string;
  term: string;
  receiptNumber: string;
  lastPaymentDate?: string;
  status: 'Unpaid' | 'Partial' | 'Paid';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number;
  subjectId: string;
  staffId?: string;
  startTime: string;
  endTime: string;
}

export interface ExamTimetableEntry {
  id: string;
  classId: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  session: string;
  term: string;
  createdAt: number;
}

export interface PromotionRecord {
  id: string;
  studentId: string;
  fromClassId: string;
  toClassId: string;
  status: 'Promoted' | 'Retained';
  session: string;
  date: string;
  createdAt: number;
}

export interface SchoolDB extends DBSchema {
  students: {
    key: string;
    value: {
      id: string;
      firstName: string;
      lastName: string;
      gender: string;
      dob: string;
      address: string;
      guardianName: string;
      guardianPhone: string;
      classId: string;
      admissionNumber: string;
      photo?: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: { 'by-class': string };
  };
  staff: {
    key: string;
    value: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      subjects: string[];
      classTeacherOf?: string;
      joinDate: string;
      createdAt: number;
      updatedAt: number;
    };
  };
  classes: {
    key: string;
    value: {
      id: string;
      name: string;
      level: string;
      classTeacherId?: string;
    };
  };
  subjects: {
    key: string;
    value: {
      id: string;
      name: string;
      code: string;
      classId: string;
    };
    indexes: { 'by-class': string };
  };
  results: {
    key: string;
    value: {
      id: string;
      studentId: string;
      subjectId: string;
      classId: string;
      term: string;
      session: string;
      test1: number;
      test2: number;
      exam: number;
      total: number;
      grade: string;
      remarks: string;
      updatedAt: number;
    };
    indexes: { 'by-student': string; 'by-class': string };
  };
  attendance: {
    key: string;
    value: {
      id: string;
      studentId: string;
      classId: string;
      date: string;
      status: 'Present' | 'Absent' | 'Late';
      updatedAt: number;
    };
    indexes: { 'by-date': string; 'by-student': string; 'by-class': string };
  };
  fees: {
    key: string;
    value: FeeRecord;
    indexes: { 'by-student': string; 'by-class': string; 'by-session': string };
  };
  timetable: {
    key: string;
    value: TimetableSlot;
    indexes: { 'by-class': string };
  };
  examTimetable: {
    key: string;
    value: ExamTimetableEntry;
    indexes: { 'by-class': string; 'by-session': string };
  };
  promotionHistory: {
    key: string;
    value: PromotionRecord;
    indexes: { 'by-student': string; 'by-session': string };
  };
  settings: {
    key: string;
    value: {
      id: string;
      schoolName: string;
      address: string;
      phone: string;
      motto: string;
      logoBase64?: string;
      currentSession: string;
      currentTerm: string;
    };
  };
  users: {
    key: string;
    value: { id: string; role: string; pin: string };
  };
}

let dbPromise: Promise<IDBPDatabase<SchoolDB>>;

export async function initDb() {
  if (!dbPromise) {
    dbPromise = openDB<SchoolDB>('schoolpro-db', 3, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('users'))
            db.createObjectStore('users', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('settings'))
            db.createObjectStore('settings', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('students')) {
            const s = db.createObjectStore('students', { keyPath: 'id' });
            s.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('staff'))
            db.createObjectStore('staff', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('classes'))
            db.createObjectStore('classes', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('subjects')) {
            const s = db.createObjectStore('subjects', { keyPath: 'id' });
            s.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('results')) {
            const s = db.createObjectStore('results', { keyPath: 'id' });
            s.createIndex('by-student', 'studentId');
            s.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('attendance')) {
            const s = db.createObjectStore('attendance', { keyPath: 'id' });
            s.createIndex('by-date', 'date');
            s.createIndex('by-student', 'studentId');
            s.createIndex('by-class', 'classId');
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('fees')) {
            const s = db.createObjectStore('fees', { keyPath: 'id' });
            s.createIndex('by-student', 'studentId');
            s.createIndex('by-class', 'classId');
            s.createIndex('by-session', 'session');
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('timetable')) {
            const s = db.createObjectStore('timetable', { keyPath: 'id' });
            s.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('examTimetable')) {
            const s = db.createObjectStore('examTimetable', { keyPath: 'id' });
            s.createIndex('by-class', 'classId');
            s.createIndex('by-session', 'session');
          }
          if (!db.objectStoreNames.contains('promotionHistory')) {
            const s = db.createObjectStore('promotionHistory', { keyPath: 'id' });
            s.createIndex('by-student', 'studentId');
            s.createIndex('by-session', 'session');
          }
        }
      },
    }).then(async (db) => {
      const tx = db.transaction(['users', 'settings', 'classes', 'staff', 'students', 'subjects'], 'readwrite');
      const admin = await tx.objectStore('users').get('admin');
      if (!admin) {
        await tx.objectStore('users').put({ id: 'admin', role: 'Admin', pin: '0000' });
        await tx.objectStore('users').put({ id: 'teacher', role: 'Teacher', pin: '1234' });
        await tx.objectStore('users').put({ id: 'principal', role: 'Principal', pin: '5678' });
        await tx.objectStore('settings').put({
          id: 'school', schoolName: 'Greenfield Academy',
          address: '123 Education Way, Lagos', phone: '+234 123 456 7890',
          motto: 'Knowledge is Power', currentSession: '2024/2025', currentTerm: '1st',
        });
        await tx.objectStore('classes').put({ id: 'c1', name: 'Primary 3', level: 'Primary' });
        await tx.objectStore('classes').put({ id: 'c2', name: 'JSS 1', level: 'Junior Secondary' });
        await tx.objectStore('classes').put({ id: 'c3', name: 'SS 2', level: 'Senior Secondary' });
        await tx.objectStore('staff').put({ id: 's1', name: 'John Doe', email: 'john@greenfield.edu', phone: '0800000001', role: 'Teacher', subjects: ['sub1'], joinDate: '2020-01-01', createdAt: Date.now(), updatedAt: Date.now() });
        await tx.objectStore('subjects').put({ id: 'sub1', name: 'Mathematics', code: 'MTH', classId: 'c1' });
        await tx.objectStore('students').put({ id: 'st1', firstName: 'Alice', lastName: 'Smith', gender: 'Female', dob: '2010-05-15', address: '123 Main St', guardianName: 'Bob Smith', guardianPhone: '08012345678', classId: 'c1', admissionNumber: 'GA/2020/001', createdAt: Date.now(), updatedAt: Date.now() });
      }
      await tx.done;
      return db;
    });
  }
  return dbPromise;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getUser(id: string) {
  const db = await initDb();
  return db.get('users', id);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings() {
  const db = await initDb();
  return db.get('settings', 'school');
}

export async function saveSettings(data: SchoolDB['settings']['value']) {
  const db = await initDb();
  return db.put('settings', data);
}

// ─── Students ─────────────────────────────────────────────────────────────────
export async function getStudents() {
  const db = await initDb();
  return db.getAll('students');
}

export async function getStudent(id: string) {
  const db = await initDb();
  return db.get('students', id);
}

export async function addStudent(data: Omit<SchoolDB['students']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await initDb();
  const record = { ...data, id: uuidv4(), createdAt: Date.now(), updatedAt: Date.now() };
  await db.put('students', record);
  return record;
}

export async function updateStudent(id: string, data: Partial<SchoolDB['students']['value']>) {
  const db = await initDb();
  const existing = await db.get('students', id);
  if (!existing) throw new Error('Student not found');
  const updated = { ...existing, ...data, id, updatedAt: Date.now() };
  await db.put('students', updated);
  return updated;
}

export async function deleteStudent(id: string) {
  const db = await initDb();
  return db.delete('students', id);
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export async function getStaff() {
  const db = await initDb();
  return db.getAll('staff');
}

export async function addStaff(data: Omit<SchoolDB['staff']['value'], 'id' | 'createdAt' | 'updatedAt'>) {
  const db = await initDb();
  const record = { ...data, id: uuidv4(), createdAt: Date.now(), updatedAt: Date.now() };
  await db.put('staff', record);
  return record;
}

export async function updateStaff(id: string, data: Partial<SchoolDB['staff']['value']>) {
  const db = await initDb();
  const existing = await db.get('staff', id);
  if (!existing) throw new Error('Staff not found');
  const updated = { ...existing, ...data, id, updatedAt: Date.now() };
  await db.put('staff', updated);
  return updated;
}

export async function deleteStaff(id: string) {
  const db = await initDb();
  return db.delete('staff', id);
}

// ─── Classes ──────────────────────────────────────────────────────────────────
export async function getClasses() {
  const db = await initDb();
  return db.getAll('classes');
}

export async function addClass(data: Omit<SchoolDB['classes']['value'], 'id'>) {
  const db = await initDb();
  const record = { ...data, id: uuidv4() };
  await db.put('classes', record);
  return record;
}

export async function updateClass(id: string, data: Partial<SchoolDB['classes']['value']>) {
  const db = await initDb();
  const existing = await db.get('classes', id);
  if (!existing) throw new Error('Class not found');
  const updated = { ...existing, ...data, id };
  await db.put('classes', updated);
  return updated;
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export async function getSubjects() {
  const db = await initDb();
  return db.getAll('subjects');
}

export async function getSubjectsByClass(classId: string) {
  const db = await initDb();
  return db.getAllFromIndex('subjects', 'by-class', classId);
}

// ─── Results ──────────────────────────────────────────────────────────────────
export async function getResults() {
  const db = await initDb();
  return db.getAll('results');
}

export async function getResultsByStudent(studentId: string) {
  const db = await initDb();
  return db.getAllFromIndex('results', 'by-student', studentId);
}

export async function getResultsByClass(classId: string) {
  const db = await initDb();
  return db.getAllFromIndex('results', 'by-class', classId);
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function getAttendance() {
  const db = await initDb();
  return db.getAll('attendance');
}

export async function getAttendanceByStudent(studentId: string) {
  const db = await initDb();
  return db.getAllFromIndex('attendance', 'by-student', studentId);
}

// ─── Fees ─────────────────────────────────────────────────────────────────────
export async function getFees() {
  const db = await initDb();
  return db.getAll('fees');
}

export async function getFeesByStudent(studentId: string) {
  const db = await initDb();
  return db.getAllFromIndex('fees', 'by-student', studentId);
}

export async function getFeesByClass(classId: string) {
  const db = await initDb();
  return db.getAllFromIndex('fees', 'by-class', classId);
}

function makeReceiptNumber(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCT-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${rand}`;
}

export async function addFee(data: Omit<FeeRecord, 'id' | 'receiptNumber' | 'status' | 'amountPaid' | 'createdAt' | 'updatedAt'>) {
  const db = await initDb();
  const record: FeeRecord = { ...data, id: uuidv4(), receiptNumber: makeReceiptNumber(), amountPaid: 0, status: 'Unpaid', createdAt: Date.now(), updatedAt: Date.now() };
  await db.put('fees', record);
  return record;
}

export async function recordPayment(feeId: string, paymentAmount: number, paymentDate: string, notes?: string) {
  const db = await initDb();
  const fee = await db.get('fees', feeId);
  if (!fee) throw new Error('Fee record not found');
  const newPaid = Math.min(fee.amountPaid + paymentAmount, fee.amount);
  const balance = fee.amount - newPaid;
  const status: FeeRecord['status'] = balance <= 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';
  const updated: FeeRecord = { ...fee, amountPaid: newPaid, status, lastPaymentDate: paymentDate, notes: notes ?? fee.notes, receiptNumber: makeReceiptNumber(), updatedAt: Date.now() };
  await db.put('fees', updated);
  return updated;
}

export async function updateFee(id: string, data: Partial<FeeRecord>) {
  const db = await initDb();
  const existing = await db.get('fees', id);
  if (!existing) throw new Error('Fee not found');
  const updated = { ...existing, ...data, id, updatedAt: Date.now() };
  await db.put('fees', updated);
  return updated;
}

export async function deleteFee(id: string) {
  const db = await initDb();
  return db.delete('fees', id);
}

// ─── Timetable ────────────────────────────────────────────────────────────────
export async function getTimetableByClass(classId: string) {
  const db = await initDb();
  return db.getAllFromIndex('timetable', 'by-class', classId);
}

export async function saveTimetableSlot(data: Omit<TimetableSlot, 'id'>) {
  const db = await initDb();
  // Replace any existing slot for same class+day+period
  const existing = await db.getAllFromIndex('timetable', 'by-class', data.classId);
  const clash = existing.find(s => s.day === data.day && s.period === data.period);
  if (clash) await db.delete('timetable', clash.id);
  const record: TimetableSlot = { ...data, id: uuidv4() };
  await db.put('timetable', record);
  return record;
}

export async function deleteTimetableSlot(id: string) {
  const db = await initDb();
  return db.delete('timetable', id);
}

export async function clearTimetableForClass(classId: string) {
  const db = await initDb();
  const slots = await db.getAllFromIndex('timetable', 'by-class', classId);
  for (const s of slots) await db.delete('timetable', s.id);
}

// ─── Exam Timetable ───────────────────────────────────────────────────────────
export async function getExamTimetable() {
  const db = await initDb();
  return db.getAll('examTimetable');
}

export async function getExamTimetableByClass(classId: string) {
  const db = await initDb();
  return db.getAllFromIndex('examTimetable', 'by-class', classId);
}

export async function addExamEntry(data: Omit<ExamTimetableEntry, 'id' | 'createdAt'>) {
  const db = await initDb();
  const record: ExamTimetableEntry = { ...data, id: uuidv4(), createdAt: Date.now() };
  await db.put('examTimetable', record);
  return record;
}

export async function updateExamEntry(id: string, data: Partial<ExamTimetableEntry>) {
  const db = await initDb();
  const existing = await db.get('examTimetable', id);
  if (!existing) throw new Error('Exam entry not found');
  const updated = { ...existing, ...data, id };
  await db.put('examTimetable', updated);
  return updated;
}

export async function deleteExamEntry(id: string) {
  const db = await initDb();
  return db.delete('examTimetable', id);
}

// ─── Promotion ────────────────────────────────────────────────────────────────
export async function getPromotionHistory() {
  const db = await initDb();
  return db.getAll('promotionHistory');
}

export async function getPromotionHistoryBySession(session: string) {
  const db = await initDb();
  return db.getAllFromIndex('promotionHistory', 'by-session', session);
}

export async function promoteStudents(
  promotions: Array<{ studentId: string; fromClassId: string; toClassId: string; status: 'Promoted' | 'Retained' }>,
  session: string
) {
  const db = await initDb();
  const date = new Date().toISOString().slice(0, 10);
  for (const p of promotions) {
    // Update student's class if promoted
    if (p.status === 'Promoted') {
      const student = await db.get('students', p.studentId);
      if (student) await db.put('students', { ...student, classId: p.toClassId, updatedAt: Date.now() });
    }
    // Log the promotion record
    const record: PromotionRecord = { id: uuidv4(), studentId: p.studentId, fromClassId: p.fromClassId, toClassId: p.toClassId, status: p.status, session, date, createdAt: Date.now() };
    await db.put('promotionHistory', record);
  }
}
