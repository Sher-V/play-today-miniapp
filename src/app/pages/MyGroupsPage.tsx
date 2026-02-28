import { useNavigate } from 'react-router';
import { ChevronLeft, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useMyGroupTrainings } from '../../hooks/useMyGroupTrainings';
import { useTelegram } from '../../hooks/useTelegram';
import { mapTrainingToGroup } from '../../utils/trainingMapper';
import { deleteGroupTraining } from '../../lib/createGroupTraining';
import { toast } from 'sonner';

export function MyGroupsPage() {
  const navigate = useNavigate();
  const { user: telegramUser, hapticFeedback } = useTelegram();
  const { trainings, loading, error } = useMyGroupTrainings(telegramUser?.id);

  const handleDelete = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!window.confirm('Удалить эту тренировку? Она исчезнет из каталога.')) return;
    try {
      await deleteGroupTraining(groupId);
      hapticFeedback?.('success');
      toast.success('Тренировка удалена');
    } catch (err) {
      hapticFeedback?.('error');
      toast.error('Не удалось удалить', { description: err instanceof Error ? err.message : undefined });
    }
  };

  if (telegramUser?.id == null) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-gray-600">
          <ChevronLeft className="w-4 h-4" />
          Назад
        </Button>
        <p className="text-sm text-gray-600">Войдите через Telegram, чтобы видеть свои тренировки.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-gray-600">
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate('/add-group')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить группу
          </Button>
        </div>
        <h2 className="font-semibold text-gray-900">Мои тренировки</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-gray-600">Загрузка...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Ошибка загрузки</p>
          <p className="mt-1 text-xs text-red-600">{error.message}</p>
        </div>
      ) : trainings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">У вас пока нет тренировок</p>
          <p className="mt-1 text-sm text-gray-500">Добавьте группу — она появится здесь</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => navigate('/add-group')}
          >
            Добавить группу
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trainings.map((t) => {
            const group = mapTrainingToGroup(t);
            return (
              <Card
                key={t.id}
                className="transition-all hover:border-gray-300 hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{group.location}</h3>
                    <p className="text-sm text-gray-600">{group.trainer}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      {group.dayOfWeek} {group.date} · {group.time} · {group.level}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-green-700">
                      {group.price.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                      onClick={() => navigate(`/my-groups/${t.id}`)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => handleDelete(e, t.id)}
                      title="Удалить тренировку"
                      aria-label="Удалить тренировку"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
