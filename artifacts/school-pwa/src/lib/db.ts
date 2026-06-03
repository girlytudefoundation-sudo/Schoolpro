import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

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
    dbPromise = openDB<SchoolDB>('schoolpro-db', 1, {
      upgrade(db) {
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

export async function getUser(id: string) {
  const db = await initDb();
  return db.get('users', id);
}

export async function getSettings() {
  const db = await initDb();
  return db.get('settings', 'school');
}

export async function getStudents() {
  const db = await initDb();
  return db.getAll('students');
}

export async function getStaff() {
  const db = await initDb();
  return db.getAll('staff');
}

export async function getClasses() {
  const db = await initDb();
  return db.getAll('classes');
}

export async function getSubjects() {
  const db = await initDb();
  return db.getAll('subjects');
}

// Add more helpers as needed...
