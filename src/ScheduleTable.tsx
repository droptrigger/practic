import React, { useState, useEffect } from 'react';
import { ScheduleCell } from './types';
import './styles/ScheduleTable.css';
import Select from 'react-select';

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

interface ScheduleTableProps {
  startLessonNumber?: number;
  date: string;
  shift: number;
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
  startLessonNumber: number;
  subjects: any[];
  teachers: any[];
  rooms: any[];
  groups: any[];
  allGroupRows: GroupRow[];
  allGroups: any[];
  times: any[];
}> = ({ row, rowIdx, hovered, setHovered, handleGroupChange, handleLessonsChange, handleCellChange, isTeacherConflict, isRoomConflict, allSelectedGroups, startLessonNumber, subjects, teachers, rooms, groups, allGroupRows, allGroups, times }) => {
  const [showSecondTeacherCells, setShowSecondTeacherCells] = useState<{[key: string]: boolean}>({});
  const [showSecondRoomCells, setShowSecondRoomCells] = useState<{[key: string]: boolean}>({});
  const [subjectTeachers, setSubjectTeachers] = useState<Record<string, any[]>>({});

  // Загружать преподавателей для выбранного предмета
  const fetchTeachers = async (subjectId: string) => {
    if (!subjectId || subjectTeachers[subjectId]) return;
    const res = await fetch(`http://localhost:4000/api/teachers/by-subject/${subjectId}`);
    const json = await res.json();
    setSubjectTeachers(prev => ({ ...prev, [subjectId]: json }));
  };

  useEffect(() => {
    // Предзагрузка для уже выбранных предметов
    row.schedule.forEach(lessonArr => {
      lessonArr.forEach(cell => {
        if (cell.subjectId) fetchTeachers(cell.subjectId);
      });
    });
    // eslint-disable-next-line
  }, [row.schedule]);

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
          {row.groups.map((groupId, groupIdx) => {
            // Список групп, выбранных в других ячейках этого ряда
            const otherSelectedGroups = row.groups.filter((g, idx) => g && idx !== groupIdx);
            // Только те группы, которые не выбраны в других ячейках, или уже выбраны в этой
            const groupOptions = allGroups
              .filter(group => !otherSelectedGroups.includes(group.id) || group.id === groupId)
              .map(group => ({
                value: group.id,
                label: group.name,
              }));
            return (
              <th key={rowIdx + '-' + groupIdx} style={{ minWidth: COLUMN_WIDTH, width: COLUMN_WIDTH }}>
                <Select
                  value={groupOptions.find(opt => opt.value === groupId) || null}
                  onChange={opt => handleGroupChange(rowIdx, groupIdx, opt ? opt.value : null)}
                  options={groupOptions}
                  placeholder="Выберите группу"
                  isClearable
                />
              </th>
            );
          })}
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
            <td className="lesson-number">{lessonIdx + startLessonNumber}</td>
            {row.groups.map((groupId, groupIdx) => (
              <td key={rowIdx + '-' + groupIdx + '-' + lessonIdx} className="group-cell">
                {groupId ? (
                  <div className="cell-content" style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <div className="subject-row" style={{width: '100%'}}>
                      <div style={{ width: '100%' }}>
                        <Select
                          value={subjects
                            .map(subject => ({ value: subject.id, label: subject.name }))
                            .find(opt => opt.value === row.schedule[lessonIdx][groupIdx].subjectId) || null}
                          onChange={opt => handleCellChange(rowIdx, lessonIdx, groupIdx, 'subjectId', opt ? opt.value : '')}
                          options={subjects.map(subject => ({ value: subject.id, label: subject.name }))}
                          placeholder="Выберите предмет"
                          isClearable
                          menuPlacement="auto"
                          styles={{ menu: base => ({ ...base, zIndex: 9999 }), container: base => ({ ...base, width: '100%' }) }}
                          classNamePrefix="react-select-subject"
                        />
                      </div>
                    </div>
                    {row.schedule[lessonIdx][groupIdx].subjectId && (
                      <>
                        <div className="teacher-room-row" style={{display: 'flex', flexDirection: 'row', gap: 4, width: '100%'}}>
                          <div className="select-container" style={{flex: 3}}>
                            <select
                              value={row.schedule[lessonIdx][groupIdx].teacherId}
                              onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'teacherId', e.target.value)}
                              className={`select ${isTeacherConflict(rowIdx, lessonIdx, groupIdx, 'teacherId') ? 'select-error' : ''} ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'teacher' ? 'select-hover' : ''}`}
                              onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'teacher'})}
                              onMouseLeave={() => setHovered(null)}
                              onFocus={() => fetchTeachers(row.schedule[lessonIdx][groupIdx].subjectId)}
                            >
                              <option value="">Преподаватель</option>
                              {(row.schedule[lessonIdx][groupIdx].subjectId
                                ? subjectTeachers[row.schedule[lessonIdx][groupIdx].subjectId] || []
                                : teachers
                              ).map(teacher => (
                                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="select-container" style={{flex: 2}}>
                            <select
                              value={row.schedule[lessonIdx][groupIdx].roomId}
                              onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'roomId', e.target.value)}
                              className={`select room-select ${isRoomConflict(rowIdx, lessonIdx, groupIdx, 'roomId') ? 'select-error' : ''} 
                              ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'room' 
                                ? 'select-hover' 
                                : ''}`}
                              onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'room'})}
                              onMouseLeave={() => setHovered(null)}
                              style={{ color: '#000', background: '#fff' }}
                            >
                              <option value="" style={{ color: '#000', background: '#fff' }}>Кабинет</option>
                              {rooms
                                .slice()
                                .sort((a, b) => {
                                  // Сортируем по числовому номеру, если есть, иначе по имени
                                  const aNum = parseInt(a.number || a.name, 10);
                                  const bNum = parseInt(b.number || b.name, 10);
                                  if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                  return (a.name || a.number || '').localeCompare(b.name || b.number || '');
                                })
                                .map(room => (
                                  <option key={room.id} value={room.id} style={{ color: '#000', background: '#fff' }}>
                                    {room.name || room.number}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                        {showSecondTeacherCells[`${lessonIdx}-${groupIdx}`] && (
                          <>
                            <div className="teacher-room-row" style={{display: 'flex', flexDirection: 'row', gap: 4, width: '100%'}}>
                              <div className="select-container" style={{flex: 3}}>
                                <select
                                  value={row.schedule[lessonIdx][groupIdx].teacherId2 || ''}
                                  onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'teacherId2', e.target.value)}
                                  className={`select ${isTeacherConflict(rowIdx, lessonIdx, groupIdx, 'teacherId2') ? 'select-error' : ''} ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'teacher2' ? 'select-hover' : ''}`}
                                  onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'teacher2'})}
                                  onMouseLeave={() => setHovered(null)}
                                  onFocus={() => fetchTeachers(row.schedule[lessonIdx][groupIdx].subjectId)}
                                >
                                  <option value="">Преподаватель</option>
                                  {(row.schedule[lessonIdx][groupIdx].subjectId
                                    ? subjectTeachers[row.schedule[lessonIdx][groupIdx].subjectId] || []
                                    : teachers
                                  ).map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="select-container" style={{flex: 2}}>
                                <select
                                  value={row.schedule[lessonIdx][groupIdx].roomId2 || ''}
                                  onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'roomId2', e.target.value)}
                                  className={`select room-select ${isRoomConflict(rowIdx, lessonIdx, groupIdx, 'roomId2') ? 'select-error' : ''} ${hovered && hovered.row === rowIdx && hovered.lesson === lessonIdx && hovered.col === groupIdx && hovered.field === 'room2' ? 'select-hover' : ''}`}
                                  onMouseEnter={() => setHovered({row: rowIdx, lesson: lessonIdx, col: groupIdx, field: 'room2'})}
                                  onMouseLeave={() => setHovered(null)}
                                  style={{color: '#000', background: '#fff'}}
                                >
                                  <option value="" style={{color: '#000', background: '#fff'}}>Кабинет</option>
                                  {rooms
                                    .slice()
                                    .sort((a, b) => {
                                      // Сортируем по числовому номеру, если есть, иначе по имени
                                      const aNum = parseInt(a.number || a.name, 10);
                                      const bNum = parseInt(b.number || b.name, 10);
                                      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                                      return (a.name || a.number || '').localeCompare(b.name || b.number || '');
                                    })
                                    .map(room => (
                                      <option key={room.id} value={room.id} style={{color: '#000', background: '#fff'}}>
                                        {room.name || room.number}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                            <div className="teacher-row-with-time" style={{display: 'flex', flexDirection: 'row', gap: 4, width: '100%', marginTop: 4}}>
                              <div style={{flex: 3, display: 'flex', alignItems: 'center'}}>
                                <span
                                  style={{color: '#d32f2f', cursor: 'pointer', fontSize: '0.85em', fontWeight: 400}}
                                  title="Удалить преподавателя"
                                  onClick={() => {
                                    setShowSecondTeacherCells(prev => ({ ...prev, [`${lessonIdx}-${groupIdx}`]: false }));
                                    setShowSecondRoomCells(prev => ({ ...prev, [`${lessonIdx}-${groupIdx}`]: false }));
                                    handleCellChange(rowIdx, lessonIdx, groupIdx, 'teacherId2', '');
                                    handleCellChange(rowIdx, lessonIdx, groupIdx, 'roomId2', '');
                                  }}
                                >
                                  - Преподаватель
                                </span>
                              </div>
                              <div style={{flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
                                <select
                                  value={row.schedule[lessonIdx][groupIdx].time || ''}
                                  onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'time', e.target.value)}
                                  className="select room-select"
                                  style={{width: '100%'}}
                                >
                                  <option value="">Время</option>
                                  {times.map(opt => (
                                    <option key={opt.id} value={opt.time}>{opt.time}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </>
                        )}
                        {!showSecondTeacherCells[`${lessonIdx}-${groupIdx}`] && (
                          <div className="teacher-row-with-time" style={{display: 'flex', flexDirection: 'row', gap: 4, width: '100%', marginTop: 6}}>
                            <div style={{flex: 3, display: 'flex', alignItems: 'center'}}>
                              <span
                                style={{color: '#1976d2', cursor: 'pointer', fontSize: '0.85em', fontWeight: 400, padding: '2px 0'}}
                                onClick={() => {
                                  setShowSecondTeacherCells(prev => ({ ...prev, [`${lessonIdx}-${groupIdx}`]: true }));
                                  setShowSecondRoomCells(prev => ({ ...prev, [`${lessonIdx}-${groupIdx}`]: true }));
                                }}
                              >
                                + Преподаватель
                              </span>
                            </div>
                            <div style={{flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end'}}>
                              <select
                                value={row.schedule[lessonIdx][groupIdx].time || ''}
                                onChange={e => handleCellChange(rowIdx, lessonIdx, groupIdx, 'time', e.target.value)}
                                className="select room-select"
                                style={{width: '100%'}}
                              >
                                <option value="">Время</option>
                                {times.map(opt => (
                                  <option key={opt.id} value={opt.time}>{opt.time}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </>
                    )}
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

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ startLessonNumber = 1, date, shift }) => {
  const [groupRows, setGroupRows] = useState<GroupRow[]>([
    {
      groups: Array(GROUPS_IN_ROW).fill(null),
      lessons: 5,
      schedule: Array.from({ length: MIN_LESSONS }, () => Array(GROUPS_IN_ROW).fill(null).map(() => ({ ...emptyCell })))
    }
  ]);
  const [hovered, setHovered] = useState<{row: number, lesson: number, col: number, field: string} | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [dupDate, setDupDate] = useState('');
  const [dupShift, setDupShift] = useState(1);
  const [dupLoading, setDupLoading] = useState(false);
  const [times, setTimes] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/subjects').then(r => r.json()).then(setSubjects);
    fetch('http://localhost:4000/api/teachers').then(r => r.json()).then(setTeachers);
    fetch('http://localhost:4000/api/rooms').then(r => r.json()).then(setRooms);
    fetch('http://localhost:4000/api/groups').then(r => r.json()).then(data => {
      setGroups(data);
      setAllGroups(data);
    });
    fetch('http://localhost:4000/api/times').then(r => r.json()).then(setTimes);
  }, []);

  // Загрузка расписания при изменении даты/смены
  useEffect(() => {
    if (!date || !shift) return;
    fetch(`http://localhost:4000/api/schedule?date=${date}&shift=${shift}`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setGroupRows(data);
        } else {
          setGroupRows([
            {
              groups: Array(GROUPS_IN_ROW).fill(null),
              lessons: 5,
              schedule: Array.from({ length: MIN_LESSONS }, () => Array(GROUPS_IN_ROW).fill(null).map(() => ({ ...emptyCell })))
            }
          ]);
        }
      });
  }, [date, shift]);

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
    console.log('handleGroupChange groupId:', groupId);
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
    if (field === 'roomId' || field === 'roomId2') {
      console.log('handleCellChange', field, 'value:', value);
    }
    setGroupRows(prev => prev.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      const newSchedule = row.schedule.map(lesson => lesson.map(cell => ({ ...cell })));
      newSchedule[lessonIdx][groupIdx][field] = value;
      if (field === 'subjectId') {
        newSchedule[lessonIdx][groupIdx]['teacherId'] = '';
      }
      // Выводим весь schedule для этого ряда
      setTimeout(() => {
        console.log('row.schedule after change:', JSON.stringify(newSchedule, null, 2));
      }, 0);
      return { ...row, schedule: newSchedule };
    }));
  };

  // Проверка: есть ли конфликт по кабинету в этом временном слоте (во всех рядах)
  const isRoomConflict = (
    _rowIdx: number,
    lessonIdx: number,
    groupIdx: number,
    field: 'roomId' | 'roomId2' = 'roomId'
  ): boolean => {
    const currentRoomId = groupRows[_rowIdx].schedule[lessonIdx][groupIdx][field];
    if (!currentRoomId) return false;
    let count = 0;
    groupRows.forEach((row, rowIdx) => {
      row.groups.forEach((groupId, idx) => {
        if (!groupId) return;
        const cell = row.schedule[lessonIdx]?.[idx];
        if (!cell) return;
        // Для своей ячейки считаем только если совпадает то же поле
        if (rowIdx === _rowIdx && idx === groupIdx) {
          if (cell[field] === currentRoomId) count++;
        } else {
          // Для других ячеек считаем оба поля
          if (cell.roomId === currentRoomId) count++;
          if (cell.roomId2 === currentRoomId) count++;
        }
      });
    });
    return count > 1;
  };

  // Проверка: есть ли конфликт по преподавателю в этом временном слоте (во всех рядах)
  const isTeacherConflict = (
    _rowIdx: number,
    lessonIdx: number,
    groupIdx: number,
    field: 'teacherId' | 'teacherId2' = 'teacherId'
  ): boolean => {
    const currentTeacherId = groupRows[_rowIdx].schedule[lessonIdx][groupIdx][field];
    if (!currentTeacherId) return false;
    let count = 0;
    groupRows.forEach((row, rowIdx) => {
      row.groups.forEach((groupId, idx) => {
        if (!groupId) return;
        const cell = row.schedule[lessonIdx]?.[idx];
        if (!cell) return;
        // Для своей ячейки считаем только если совпадает то же поле
        if (rowIdx === _rowIdx && idx === groupIdx) {
          if (cell[field] === currentTeacherId) count++;
        } else {
          // Для других ячеек считаем оба поля
          if (cell.teacherId === currentTeacherId) count++;
          if (cell.teacherId2 === currentTeacherId) count++;
        }
      });
    });
    return count > 1;
  };

  // Удалить ряд по индексу с подтверждением
  const handleRemoveRow = (rowIdx: number) => {
    if (window.confirm('Удалить ряд?')) {
      setGroupRows(prev => prev.filter((_, idx) => idx !== rowIdx));
    }
  };

  // Сохранение расписания
  const handleSave = async () => {
    await fetch('http://localhost:4000/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, shift, data: groupRows }),
    });
    alert('Расписание сохранено!');
  };

  // Дублирование расписания
  const handleDuplicate = async () => {
    setDupLoading(true);
    const res = await fetch(`http://localhost:4000/api/schedule?date=${dupDate}&shift=${dupShift}`);
    const data = await res.json();
    setDupLoading(false);
    setShowDuplicate(false);
    if (data && Array.isArray(data)) {
      setGroupRows(data);
    } else {
      alert('Расписание не найдено!');
    }
  };

  return (
    <div className="schedule-container">
      {groupRows.map((row, rowIdx) => {
        const allSelectedGroups = groupRows
          .flatMap((r, idx) => idx !== rowIdx ? r.groups.filter(Boolean) : []) as string[];
        return (
          <div key={rowIdx} style={{position: 'relative'}}>
            <GroupRowTable
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
              startLessonNumber={startLessonNumber}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              groups={groups}
              allGroupRows={groupRows}
              allGroups={allGroups}
              times={times}
            />
            {groupRows.length > 1 && (
              <button
                style={{position: 'absolute', top: 45, right: 8, zIndex: 2, background: '#fff', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, padding: '2px 10px', fontSize: '0.95em', cursor: 'pointer'}}
                onClick={() => handleRemoveRow(rowIdx)}
                title="Удалить ряд"
              >
                Удалить ряд
              </button>
            )}
          </div>
        );
      })}
      <div className="add-row-button">
        <button
          style={{width: '95%'}}
          onClick={() => {
            setGroupRows(prev => [
              ...prev,
              {
                groups: Array(GROUPS_IN_ROW).fill(null),
                lessons: 5,
                schedule: Array.from({ length: MIN_LESSONS }, () => Array(GROUPS_IN_ROW).fill(null).map(() => ({ ...emptyCell })))
              }
            ]);
          }}
        >
          Добавить ряд
        </button>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 24, alignItems: 'center'}}>
        <button
          style={{width: '48%', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px rgba(25,118,210,0.08)'}}
          onClick={handleSave}
        >
          Сохранить расписание
        </button>
        <button
          style={{width: '48%', background: '#f5f5f5', color: '#1976d2', border: '1.5px solid #1976d2', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 17, cursor: 'pointer', boxShadow: '0 2px 8px rgba(25,118,210,0.04)'}}
          onClick={() => setShowDuplicate(true)}
        >
          Дублировать
        </button>
      </div>
      {showDuplicate && (
        <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(25,118,210,0.12)'}}>
            <h3 style={{marginBottom: 18, color: '#1976d2'}}>Дублировать расписание</h3>
            <div style={{marginBottom: 16}}>
              <label>Дата:
                <input type="date" value={dupDate} onChange={e => setDupDate(e.target.value)} style={{marginLeft: 8}} />
              </label>
            </div>
            <div style={{marginBottom: 24}}>
              <label>Смена:
                <select value={dupShift} onChange={e => setDupShift(Number(e.target.value))} style={{marginLeft: 8}}>
                  <option value={1}>Первая</option>
                  <option value={2}>Вторая</option>
                </select>
              </label>
            </div>
            <div style={{display: 'flex', gap: 12}}>
              <button
                onClick={handleDuplicate}
                disabled={!dupDate || dupLoading}
                style={{background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: dupLoading ? 'not-allowed' : 'pointer', opacity: dupLoading ? 0.7 : 1}}
              >
                {dupLoading ? 'Загрузка...' : 'Дублировать'}
              </button>
              <button
                onClick={() => setShowDuplicate(false)}
                style={{background: '#f5f5f5', color: '#1976d2', border: '1.5px solid #1976d2', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTable; 