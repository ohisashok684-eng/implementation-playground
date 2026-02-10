import { useState } from 'react';
import { Sparkles, Target, BookOpen, X } from 'lucide-react';
import type { DiaryEntry } from '@/types/mentoring';

interface TrackingTabProps {
  diaryEntries: DiaryEntry[];
  onSaveDaily: (form: { energy: number; text: string; intent: string }) => void;
  onSaveWeekly: (form: { achievements: string; lessons: string; nextStep: string }) => void;
}

const TrackingTab = ({ diaryEntries, onSaveDaily, onSaveWeekly }: TrackingTabProps) => {
  const [trackingMode, setTrackingMode] = useState<'daily' | 'weekly' | 'diary'>('daily');
  const [dailyForm, setDailyForm] = useState({ energy: 5, text: '', intent: '' });
  const [weeklyForm, setWeeklyForm] = useState({ achievements: '', lessons: '', nextStep: '' });
  const [viewingEntry, setViewingEntry] = useState<DiaryEntry | null>(null);

  const handleSaveDaily = () => {
    onSaveDaily(dailyForm);
    setDailyForm({ energy: 5, text: '', intent: '' });
    setTrackingMode('diary');
  };

  const handleSaveWeekly = () => {
    onSaveWeekly(weeklyForm);
    setWeeklyForm({ achievements: '', lessons: '', nextStep: '' });
    setTrackingMode('diary');
  };

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
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="label-tiny">Как вы себя чувствуете?</p>
              <textarea
                value={dailyForm.text}
                onChange={(e) => setDailyForm({ ...dailyForm, text: e.target.value })}
                placeholder="Опишите свое состояние..."
                rows={3}
                className="input-glass resize-none"
              />
            </div>
            <div className="space-y-2">
              <p className="label-tiny">Намерение на сегодня?</p>
              <input
                type="text"
                value={dailyForm.intent}
                onChange={(e) => setDailyForm({ ...dailyForm, intent: e.target.value })}
                placeholder="Главный фокус..."
                className="input-glass"
              />
            </div>
            <div className="space-y-3">
              <p className="label-tiny">Уровень энергии</p>
              <div className="flex justify-between space-x-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDailyForm({ ...dailyForm, energy: num })}
                    className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition-all ${
                      dailyForm.energy === num
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-card text-muted-foreground'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveDaily} className="w-full py-5 btn-dark">
              Зафиксировать день
            </button>
          </div>
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
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="label-tiny">Главные достижения недели?</p>
              <textarea
                value={weeklyForm.achievements}
                onChange={(e) => setWeeklyForm({ ...weeklyForm, achievements: e.target.value })}
                placeholder="Что удалось реализовать..."
                rows={3}
                className="input-glass resize-none"
              />
            </div>
            <div className="space-y-2">
              <p className="label-tiny">Уроки и инсайты?</p>
              <textarea
                value={weeklyForm.lessons}
                onChange={(e) => setWeeklyForm({ ...weeklyForm, lessons: e.target.value })}
                placeholder="Что поняли о себе или бизнесе..."
                rows={3}
                className="input-glass resize-none"
              />
            </div>
            <div className="space-y-2">
              <p className="label-tiny">Главный шаг на следующую неделю?</p>
              <input
                type="text"
                value={weeklyForm.nextStep}
                onChange={(e) => setWeeklyForm({ ...weeklyForm, nextStep: e.target.value })}
                placeholder="Приоритетное действие..."
                className="input-glass"
              />
            </div>
            <button onClick={handleSaveWeekly} className="w-full py-5 btn-dark">
              Завершить неделю
            </button>
          </div>
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
      {viewingEntry && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[700] flex items-center justify-center p-4 animate-in">
          <div className="glass-strong card-round-lg w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen size={20} className="text-secondary" />
                <div>
                  <h3 className="text-lg font-black text-foreground">
                    {viewingEntry.type === 'daily' ? 'Итоги дня' : 'Итоги недели'}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">{viewingEntry.date}</p>
                </div>
              </div>
              <button onClick={() => setViewingEntry(null)} className="text-muted-foreground hover:text-foreground p-2">
                <X size={24} />
              </button>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingTab;
