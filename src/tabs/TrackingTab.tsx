import { useState } from 'react';
import { Sparkles, Target, BookOpen } from 'lucide-react';
import ModalOverlay from '@/components/ModalOverlay';
import ScaleInput from '@/components/ScaleInput';
import type { DiaryEntry } from '@/types/mentoring';

interface TrackingQuestion {
  id: string;
  question_type: string;
  question_text: string;
  field_type: string;
  sort_order: number;
}

interface TrackingTabProps {
  userId: string;
  diaryEntries: DiaryEntry[];
  onSaveDaily: (form: { energy: number; text: string; intent: string }) => void;
  onSaveWeekly: (form: { achievements: string; lessons: string; nextStep: string }) => void;
  trackingQuestions: TrackingQuestion[];
}

const TrackingTab = ({ userId, diaryEntries, onSaveDaily, onSaveWeekly, trackingQuestions }: TrackingTabProps) => {
  const [trackingMode, setTrackingMode] = useState<'daily' | 'weekly' | 'diary'>('daily');
  const [dailyAnswers, setDailyAnswers] = useState<Record<string, string | number>>({});
  const [weeklyAnswers, setWeeklyAnswers] = useState<Record<string, string>>({});
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);

  const dailyQuestions = trackingQuestions.filter(q => q.question_type === 'daily');
  const weeklyQuestions = trackingQuestions.filter(q => q.question_type === 'weekly');

  const handleSaveDaily = () => {
    const textAnswers = Object.values(dailyAnswers).filter(v => typeof v === 'string').join('; ');
    const energy = Object.values(dailyAnswers).find(v => typeof v === 'number') as number || 5;
    onSaveDaily({ energy, text: textAnswers, intent: '' });
    setDailyAnswers({});
    setTrackingMode('diary');
  };

  const handleSaveWeekly = () => {
    const textAnswers = Object.values(weeklyAnswers);
    onSaveWeekly({
      achievements: textAnswers[0] || '',
      lessons: textAnswers[1] || '',
      nextStep: textAnswers[2] || '',
    });
    setWeeklyAnswers({});
    setTrackingMode('diary');
  };

  const noQuestions = dailyQuestions.length === 0 && weeklyQuestions.length === 0;

  return (
    <div className="space-y-4 animate-in">
      {/* Mode Switcher */}
      <div className="glass card-round p-1.5 flex space-x-1">
        {(['daily', 'weekly', 'diary'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTrackingMode(mode)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
              trackingMode === mode
                ? 'bg-foreground text-white shadow-lg'
                : 'text-muted-foreground'
            }`}
          >
            {mode === 'daily' ? 'ежедневный' : mode === 'weekly' ? 'еженедельный' : 'дневник'}
          </button>
        ))}
      </div>

      {/* Daily */}
      {trackingMode === 'daily' && (
        <section className="glass card-round-lg p-6 space-y-6 animate-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Ежедневный трекинг</h3>
          </div>
          {dailyQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Вопросы для ежедневного трекинга пока не добавлены</p>
          ) : (
            <div className="space-y-5">
              {dailyQuestions.map(q => (
                <div key={q.id} className="space-y-2">
                  <p className="label-tiny">{q.question_text}</p>
                  {q.field_type === 'scale' ? (
                    <ScaleInput
                      value={dailyAnswers[q.id]}
                      onChange={(num) => setDailyAnswers({ ...dailyAnswers, [q.id]: num })}
                      activeColor="bg-emerald-500 text-white"
                    />
                  ) : (
                    <textarea
                      value={(dailyAnswers[q.id] as string) || ''}
                      onChange={(e) => setDailyAnswers({ ...dailyAnswers, [q.id]: e.target.value })}
                      placeholder="Ваш ответ..."
                      rows={3}
                      className="input-glass resize-none"
                    />
                  )}
                </div>
              ))}
              <button onClick={handleSaveDaily} className="w-full py-5 btn-dark">
                Зафиксировать день
              </button>
            </div>
          )}
        </section>
      )}

      {/* Weekly */}
      {trackingMode === 'weekly' && (
        <section className="glass card-round-lg p-6 space-y-6 animate-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-light text-secondary rounded-xl">
              <Target size={20} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Еженедельный трекинг</h3>
          </div>
          {weeklyQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Вопросы для еженедельного трекинга пока не добавлены</p>
          ) : (
            <div className="space-y-5">
              {weeklyQuestions.map(q => (
                <div key={q.id} className="space-y-2">
                  <p className="label-tiny">{q.question_text}</p>
                  {q.field_type === 'scale' ? (
                    <ScaleInput
                      value={weeklyAnswers[q.id]}
                      onChange={(num) => setWeeklyAnswers({ ...weeklyAnswers, [q.id]: String(num) })}
                      activeColor="bg-secondary text-white"
                    />
                  ) : (
                    <textarea
                      value={weeklyAnswers[q.id] || ''}
                      onChange={(e) => setWeeklyAnswers({ ...weeklyAnswers, [q.id]: e.target.value })}
                      placeholder="Ваш ответ..."
                      rows={3}
                      className="input-glass resize-none"
                    />
                  )}
                </div>
              ))}
              <button onClick={handleSaveWeekly} className="w-full py-5 btn-dark">
                Завершить неделю
              </button>
            </div>
          )}
        </section>
      )}

      {/* Diary */}
      {trackingMode === 'diary' && (
        <section className="space-y-3 animate-in">
          {diaryEntries.length === 0 ? (
            <div className="glass card-round-lg p-10 text-center">
              <p className="text-muted-foreground text-sm font-medium">Дневник пока пуст</p>
            </div>
          ) : (
            diaryEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setViewingEntry(entry)}
                className="w-full text-left glass card-round p-5 space-y-2 transition-transform active:scale-[0.98] hover:bg-card"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    entry.type === 'daily' ? 'text-emerald-500' : 'text-secondary'
                  }`}>
                    {entry.type === 'daily' ? 'День' : 'Неделя'}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">{entry.date}</span>
                </div>
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {entry.type === 'daily' ? entry.text : entry.achievements}
                </p>
                {entry.type === 'daily' && entry.energy && (
                  <div className="flex items-center space-x-2">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(entry.energy / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{entry.energy}/10</span>
                  </div>
                )}
              </button>
            ))
          )}
        </section>
      )}

      {/* View Entry Modal */}
      <ModalOverlay
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title={viewingEntry?.type === 'daily' ? 'Итоги дня' : 'Итоги недели'}
        icon={<BookOpen size={20} className="text-secondary" />}
      >
        {viewingEntry && (
          <>
            <p className="text-xs text-muted-foreground font-medium -mt-4">{viewingEntry.date}</p>
            {viewingEntry.type === 'daily' ? (
              <div className="space-y-4">
                <div>
                  <p className="label-tiny mb-1">Состояние:</p>
                  <p className="text-sm font-medium text-foreground italic">«{viewingEntry.text}»</p>
                </div>
                <div>
                  <p className="label-tiny mb-1">Намерение:</p>
                  <p className="text-sm font-medium text-foreground">{viewingEntry.intent}</p>
                </div>
                <div className="flex items-center justify-center p-4 bg-muted/50 card-round">
                  <span className="text-3xl font-black text-foreground mr-2">{viewingEntry.energy}</span>
                  <span className="text-xs text-muted-foreground font-medium">Уровень энергии</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="label-tiny mb-1">Достижения:</p>
                  <p className="text-sm font-medium text-foreground">{viewingEntry.achievements}</p>
                </div>
                <div>
                  <p className="label-tiny mb-1">Уроки:</p>
                  <p className="text-sm font-medium text-foreground">{viewingEntry.lessons}</p>
                </div>
                <div>
                  <p className="label-tiny mb-1">Следующий шаг:</p>
                  <p className="text-sm font-medium text-foreground">{viewingEntry.nextStep}</p>
                </div>
              </div>
            )}

            <button onClick={() => setViewingEntry(null)} className="w-full py-5 btn-dark">
              Закрыть
            </button>
          </>
        )}
      </ModalOverlay>
    </div>
  );
};

export default TrackingTab;
