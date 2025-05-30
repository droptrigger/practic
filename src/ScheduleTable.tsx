import React, { useState } from 'react';
import { groups as allGroups } from './groups';
import { subjects } from './subjects';
import { teachers } from './teachers';
import { rooms } from './rooms';
import { ScheduleCell } from './types';
import './styles/ScheduleTable.css';

const GROUPS_IN_ROW = 7;
const MIN_LESSONS = 4;
const MAX_LESSONS = 6;
const COLUMN_WIDTH = 180;

const emptyCell: ScheduleCell = { subjectId: '', teacherId: '', roomId: '' };

// Для каждого ряда: группы, количество пар, расписание
interface GroupRow {
  groups: (string | null)[];
  lessons: number;
  schedule: ScheduleCell[][]; // [lesson][group]
}

// Компонент для отображения одного ряда групп
const GroupRowTable: React.FC<{
  row: GroupRow;
  rowIdx: number;
  hovered: any;
  setHovered: any;
  handleGroupChange: any;
  handleLessonsChange: any;
  handleCellChange: any;
  isTeacherConflict: any;
  isRoomConflict: any;
  allSelectedGroups: string[];
}> = ({ row, rowIdx, hovered, setHovered, handleGroupChange, handleLessonsChange, handleCellChange, isTeacherConflict, isRoomConflict, allSelectedGroups }) => {
  const [showSecondTeacherCells, setShowSecondTeacherCells] = useState<{[key: string]: boolean}>({});
  const [showSecondRoomCells, setShowSecondRoomCells] = useState<{[key: string]: boolean}>({});

  const toggleSecondTeacher = (lessonIdx: number, groupIdx: number) => {
    const key = `${lessonIdx}-${groupIdx}`;
    setShowSecondTeacherCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    if (showSecondTeacherCells[key]) {
      handleCellChange(rowIdx, lessonIdx, groupIdx, 'teacherId2', '');
    }
  };

  const toggleSecondRoom = (lessonIdx: number, groupIdx: number) => {
    const key = `${lessonIdx}-${groupIdx}`;
    setShowSecondRoomCells(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    if (showSecondRoomCells[key]) {
      handleCellChange(rowIdx, lessonIdx, groupIdx, 'roomId2', '');
    }
  };

  return (
    <table border={1} cellPadding={6} className="schedule-table">
      <thead>
        <tr>
          <th style={{ maxWidth: 40 }}></th>
          {row.groups.map((groupId, idx) => (
            <th key={rowIdx + '-' + idx} style={{ minWidth: COLUMN_WIDTH, width: COLUMN_WIDTH }}>
              <select
                value={groupId || ''}
                onChange={e => handleGroupChange(rowIdx, idx, e.target.value || null)}
                className={`select ${hovered && hovered.row === rowIdx && hovered.lesson === -1 && hovered.col === idx ? 'select-hover' : ''}`}
                onMouseEnter={() => setHovered({row: rowIdx, lesson: -1, col: idx, field: 'group'})}
                onMouseLeave={() => setHovered(null)}
              >
                <option value="">Выберите группу</option>
                {allGroups
                  .filter(g => {
                    const isSelectedElsewhere = allSelectedGroups.includes(g.id);
                    const isSelectedInThisRow = row.groups.some((gid, i) => gid === g.id && i !== idx);
                    return (!isSelectedElsewhere && !isSelectedInThisRow) || g.id === groupId;
                  })
                  .map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
              </select>
            </th>
          ))}
        </tr>
        <tr>
          <th></th>
          <th colSpan={GROUPS_IN_ROW} className="lessons-count">
            <label>
              Количество пар:
              <select
                value={row.lessons}
                onChange={e => handleLessonsChange(rowIdx, Number(e.target.value))}
                className="lessons-select"
              >
                {Array.from({ length: MAX_LESSONS - MIN_LESSONS + 1 }, (_, i) => i + MIN_LESSONS).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: row.lessons }, (_, lessonIdx) => (
          <tr key={lessonIdx}>
            <td className="lesson-number">{lessonIdx + 1}</td>
            {row.groups.map((groupId, groupIdx) => (
              <td key={rowIdx + '-' + groupIdx + '-' + lessonIdx} className="group-cell">
                {groupId ? (
                  <div className="cell-content">
                    <div className="subject-section">
                      <select
                        value={row.schedule[lessonIdx][groupIdx].subjectId}
                        onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'subjectId', e.target.value)}
                        className={`select ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'subject' ? 'select-hover' : ''}`}
                        onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'subject'})}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <option value="">Предмет</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                      <div className="select-container">
                        <select
                          value={row.schedule[lessonIdx][groupIdx].teacherId}
                          onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'teacherId', e.target.value)}
                          className={`select ${isTeacherConflict(rowIdx, lessonIdx, groupIdx) ? 'select-error' : ''} ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'teacher' ? 'select-hover' : ''}`}
                          onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'teacher'})}
                          onMouseLeave={() => setHovered(null)}
                          disabled={!row.schedule[lessonIdx][groupIdx].subjectId}
                        >
                          <option value="">Преподаватель</option>
                          {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="toggle-button"
                          onClick={() => toggleSecondTeacher(lessonIdx, groupIdx)}
                        >
                          {showSecondTeacherCells[`${lessonIdx}-${groupIdx}`] ? '−' : '+'}
                        </button>
                      </div>
                      {showSecondTeacherCells[`${lessonIdx}-${groupIdx}`] && (
                        <div className="select-container">
                          <select
                            value={row.schedule[lessonIdx][groupIdx].teacherId2 || ''}
                            onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'teacherId2', e.target.value)}
                            className={`select ${isTeacherConflict(rowIdx, lessonIdx, groupIdx) ? 'select-error' : ''} ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'teacher2' ? 'select-hover' : ''}`}
                            onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'teacher2'})}
                            onMouseLeave={() => setHovered(null)}
                            disabled={!row.schedule[lessonIdx][groupIdx].subjectId}
                          >
                            <option value="">Преподаватель</option>
                            {teachers.map(teacher => (
                              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="room-section">
                      <div className="select-container">
                        <select
                          value={row.schedule[lessonIdx][groupIdx].roomId}
                          onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'roomId', e.target.value)}
                          className={`select ${isRoomConflict(rowIdx, lessonIdx, groupIdx) ? 'select-error' : ''} 
                          ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'room' 
                            ? 'select-hover' 
                            : ''}`}
                          onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'room'})}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <option value="">Кабинет</option>
                          {rooms.map(room => (
                            <option key={room.id} value={room.id}>{room.number}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="toggle-button"
                          onClick={() => toggleSecondRoom(lessonIdx, groupIdx)}
                        >
                          {showSecondRoomCells[`${lessonIdx}-${groupIdx}`] ? '−' : '+'}
                        </button>
                      </div>
                      {showSecondRoomCells[`${lessonIdx}-${groupIdx}`] && (
                        <div className="select-container">
                          <select
                            value={row.schedule[lessonIdx][groupIdx].roomId2 || ''}
                            onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'roomId2', e.target.value)}
                            className={`select ${isRoomConflict(rowIdx, lessonIdx, groupIdx) ? 'select-error' : ''} ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'room2' ? 'select-hover' : ''}`}
                            onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'room2'})}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <option value="">Кабинет</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id}>{room.number}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="empty-cell">—</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Синхронизация schedule: всегда lessons x GROUPS_IN_ROW, каждая ячейка — ScheduleCell
function syncSchedule(schedule: ScheduleCell[][], lessons: number, groupsCount: number): ScheduleCell[][] {
  return Array.from({ length: lessons }, (v, lessonIdx) =>
    Array.from({ length: groupsCount }, (v, groupIdx) =>
      schedule[lessonIdx]?.[groupIdx] ? { ...schedule[lessonIdx][groupIdx] } : { ...emptyCell }
    )
  );
}

export const ScheduleTable: React.FC = () => {
  const [groupRows, setGroupRows] = useState<GroupRow[]>([
    {
      groups: Array(GROUPS_IN_ROW).fill(null),
      lessons: MIN_LESSONS,
      schedule: Array.from({ length: MIN_LESSONS }, () => Array(GROUPS_IN_ROW).fill(null).map(() => ({ ...emptyCell })))
    }
  ]);
  const [hovered, setHovered] = useState<{row: number, lesson: number, col: number, field: string} | null>(null);

  // Изменить количество пар в ряду
  const handleLessonsChange = (rowIdx: number, newCount: number) => {
    setGroupRows(prev => prev.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const newSchedule = syncSchedule(row.schedule, newCount, GROUPS_IN_ROW);
      return { ...row, lessons: newCount, schedule: newSchedule };
    }));
  };

  // Обработчик выбора группы
  const handleGroupChange = (rowIdx: number, groupIdx: number, groupId: string | null) => {
    setGroupRows(prev => prev.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      const updatedGroups = [...row.groups];
      updatedGroups[groupIdx] = groupId;
      const newSchedule = syncSchedule(row.schedule, row.lessons, GROUPS_IN_ROW);
      return { ...row, groups: updatedGroups, schedule: newSchedule };
    }));
  };

  // Обработчик изменения ячейки расписания
  const handleCellChange = (rowIdx: number, lessonIdx: number, groupIdx: number, field: keyof ScheduleCell, value: string) => {
    setGroupRows(prev => prev.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      const newSchedule = row.schedule.map(lesson => lesson.map(cell => ({ ...cell })));
      newSchedule[lessonIdx][groupIdx][field] = value;
      if (field === 'subjectId') {
        newSchedule[lessonIdx][groupIdx]['teacherId'] = '';
      }
      return { ...row, schedule: newSchedule };
    }));
  };

  // Проверка: есть ли конфликт по кабинету в этом временном слоте (в пределах ряда)
  const isRoomConflict = (rowIdx: number, lessonIdx: number, groupIdx: number): boolean => {
    const row = groupRows[rowIdx];
    const roomId = row.schedule[lessonIdx][groupIdx].roomId;
    if (!roomId) return false;
    const count = row.groups.reduce((acc, groupId, idx) => {
      if (!groupId) return acc;
      if (row.schedule[lessonIdx][idx].roomId === roomId) return acc + 1;
      return acc;
    }, 0);
    return count > 1;
  };

  // Проверка: есть ли конфликт по преподавателю в этом временном слоте (в пределах ряда)
  const isTeacherConflict = (rowIdx: number, lessonIdx: number, groupIdx: number): boolean => {
    const row = groupRows[rowIdx];
    const teacherId = row.schedule[lessonIdx][groupIdx].teacherId;
    if (!teacherId) return false;
    const count = row.groups.reduce((acc, groupId, idx) => {
      if (!groupId) return acc;
      if (row.schedule[lessonIdx][idx].teacherId === teacherId) return acc + 1;
      return acc;
    }, 0);
    return count > 1;
  };

  return (
    <div className="schedule-container">
      {groupRows.map((row, rowIdx) => {
        const allSelectedGroups = groupRows
          .flatMap((r, idx) => idx !== rowIdx ? r.groups.filter(Boolean) : []) as string[];
        return (
          <GroupRowTable
            key={rowIdx}
            row={row}
            rowIdx={rowIdx}
            hovered={hovered}
            setHovered={setHovered}
            handleGroupChange={handleGroupChange}
            handleLessonsChange={handleLessonsChange}
            handleCellChange={handleCellChange}
            isTeacherConflict={isTeacherConflict}
            isRoomConflict={isRoomConflict}
            allSelectedGroups={allSelectedGroups}
          />
        );
      })}
      <div className="add-row-button">
        <button
          onClick={() => {
            setGroupRows(prev => [
              ...prev,
              {
                groups: Array(GROUPS_IN_ROW).fill(null),
                lessons: MIN_LESSONS,
                schedule: Array.from({ length: MIN_LESSONS }, () => Array(GROUPS_IN_ROW).fill(null).map(() => ({ ...emptyCell })))
              }
            ]);
          }}
        >
          Добавить ряд
        </button>
      </div>
    </div>
  );
};

export default ScheduleTable; 