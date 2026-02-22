import { X } from 'lucide-react';
import { Button } from './ui/button';

interface LevelInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LevelInfoDrawer({ isOpen, onClose }: LevelInfoDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Уровни игры NTRP</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">0-1</span>
                <span className="text-sm text-gray-600">Начинающий</span>
              </div>
              <p className="text-sm text-gray-700">
                Только начинаете играть в теннис или имеете небольшой опыт. Осваиваете основы: как держать ракетку, правильную стойку и базовые удары. Учитесь перебивать мяч через сетку.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">1.5-2</span>
                <span className="text-sm text-gray-600">Начинающий+</span>
              </div>
              <p className="text-sm text-gray-700">
                Уверенно перебиваете мяч через сетку, освоили базовую технику ударов. Можете поддерживать простой розыгрыш, но контроль мяча и точность ударов еще развиваются. Начинаете осваивать тактические элементы игры.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">2.5-3</span>
                <span className="text-sm text-gray-600">Средний</span>
              </div>
              <p className="text-sm text-gray-700">
                Играете периодически для удовольствия. Довольно уверенно отбиваете мяч и ведете розыгрыш. Владеете базовой техникой форхенда, бэкхенда и подачи. Можете играть в парах и понимаете основную тактику игры.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">3-3.5</span>
                <span className="text-sm text-gray-600">Продвинутый</span>
              </div>
              <p className="text-sm text-gray-700">
                Регулярно тренируетесь и имеете стабильную технику всех основных ударов. Используете вращения и можете менять темп игры. Понимаете тактику и применяете её в матчах. Играете в клубных турнирах.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">4+</span>
                <span className="text-sm text-gray-600">Продвинутый+</span>
              </div>
              <p className="text-sm text-gray-700">
                Высокий уровень игры с отличной техникой и физической подготовкой. Уверенно играете с верхним и нижним вращением, используете сложную тактику. Активно участвуете в соревнованиях и турнирах. Возможен опыт профессиональной игры.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>NTRP</strong> (National Tennis Rating Program) — система рейтингования теннисистов, используемая для определения уровня игры от 1.0 до 7.0.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}