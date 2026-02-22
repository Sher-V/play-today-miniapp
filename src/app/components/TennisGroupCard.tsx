import { Calendar, Users, MapPin, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

export interface TennisGroup {
  id: string;
  trainer: string;
  location: string;
  date: string;
  time: string;
  level: string;
  levelColor: 'green' | 'blue' | 'purple';
  groupSize: string;
  price: number;
  spots: number;
  maxSpots: number;
  dayOfWeek: string;
  isRecurring?: boolean;
  secondDate?: string;
  secondDayOfWeek?: string;
}

interface TennisGroupCardProps {
  group: TennisGroup;
  onTrainerClick: () => void;
  onBookingClick: () => void;
}

export function TennisGroupCard({ group, onTrainerClick, onBookingClick }: TennisGroupCardProps) {
  const levelColors = {
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <Card 
      className="hover:shadow-xl transition-all duration-200 border-2 cursor-pointer group hover:border-blue-300"
      onClick={onTrainerClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg mb-1 text-gray-900">
              {group.location}
            </h3>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-sm">{group.trainer}</span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Badge
            variant="outline"
            className={`${levelColors[group.levelColor]} text-xs`}
          >
            {group.level}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{group.dayOfWeek} {group.date}</span>
              {group.isRecurring && group.secondDate && group.secondDayOfWeek && (
                <span className="text-sm text-gray-500">{group.secondDayOfWeek} {group.secondDate}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm">{group.time}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm">{group.groupSize}</span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="font-semibold text-lg text-green-700">
              {group.price.toLocaleString('ru-RU')}₽
            </span>
            <span className="text-gray-500 text-sm">за занятие</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrainerClick();
            }}
            className="flex-1 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Подробнее о тренере
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBookingClick();
            }}
            className="flex-1 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700"
          >
            Записаться
          </button>
        </div>
      </CardContent>
    </Card>
  );
}