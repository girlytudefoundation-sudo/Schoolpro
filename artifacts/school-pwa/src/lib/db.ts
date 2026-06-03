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
    indexes: {
      'by-student': string;
      'by-class': string;
    };
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
    indexes: {
      'by-date': string;
      'by-student': string;
      'by-class': string;
    };
  };
  fees: {
    key: string;
    value: FeeRecord;
    indexes: {
      'by-student': string;
      'by-class': string;
      'by-session': string;
    };
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
    value: {
      id: string;
      role: string;
      pin: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SchoolDB>>;

export async function initDb() {
  if (!dbPromise) {
    dbPromise = openDB<SchoolDB>('schoolpro-db', 2, {
      upgrade(db, oldVersion) {
        // v1 stores
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('students')) {
            const store = db.createObjectStore('students', { keyPath: 'id' });
            store.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('staff')) {
            db.createObjectStore('staff', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('classes')) {
            db.createObjectStore('classes', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('subjects')) {
            const store = db.createObjectStore('subjects', { keyPath: 'id' });
            store.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('results')) {
            const store = db.createObjectStore('results', { keyPath: 'id' });
            store.createIndex('by-student', 'studentId');
            store.createIndex('by-class', 'classId');
          }
          if (!db.objectStoreNames.contains('attendance')) {
            const store = db.createObjectStore('attendance', { keyPath: 'id' });
            store.createIndex('by-date', 'date');
            store.createIndex('by-student', 'studentId');
            store.createIndex('by-class', 'classId');
          }
        }
        // v2: fees store
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('fees')) {
            const store = db.createObjectStore('fees', { keyPath: 'id' });
            store.createIndex('by-student', 'studentId');
            store.createIndex('by-class', 'classId');
            store.createIndex('by-session', 'session');
          }
        }
      },
    }).then(async (db) => {
      // Seed initial data if empty
      const tx = db.transaction(['users', 'settings', 'classes', 'staff', 'students', 'subjects'], 'readwrite');
      const usersStore = tx.objectStore('users');
      const admin = await usersStore.get('admin');
      if (!admin) {
        await usersStore.put({ id: 'admin', role: 'Admin', pin: '0000' });
        await usersStore.put({ id: 'teacher', role: 'Teacher', pin: '1234' });
        await usersStore.put({ id: 'principal', role: 'Principal', pin: '5678' });

        await tx.objectStore('settings').put({
          id: 'school',
          schoolName: 'Greenfield Academy',
          address: '123 Education Way, Lagos',
          phone: '+234 123 456 7890',
          motto: 'Knowledge is Power',
          currentSession: '2024/2025',
          currentTerm: '1st',
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

// ─── Subjects ─────────────────────────────────────────────────────────────────
export async function getSubjects() {
  const db = await initDb();
  return db.getAll('subjects');
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
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RCT-${y}${m}${d}-${rand}`;
}

export async function addFee(data: Omit<FeeRecord, 'id' | 'receiptNumber' | 'status' | 'amountPaid' | 'createdAt' | 'updatedAt'>) {
  const db = await initDb();
  const record: FeeRecord = {
    ...data,
    id: uuidv4(),
    receiptNumber: makeReceiptNumber(),
    amountPaid: 0,
    status: 'Unpaid',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
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
  const updated: FeeRecord = {
    ...fee,
    amountPaid: newPaid,
    status,
    lastPaymentDate: paymentDate,
    notes: notes ?? fee.notes,
    receiptNumber: makeReceiptNumber(),
    updatedAt: Date.now(),
  };
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
