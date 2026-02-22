import { SlidersHorizontal, X, Sun, Cloud, Moon, Info } from 'lucide-react';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
import { LevelInfoDrawer } from './LevelInfoDrawer';

export interface FilterState {
  timeOfDay: string[];
  level: string[];
}

interface TennisFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  activeFiltersCount: number;
}

export function TennisFilters({ filters, onFilterChange, activeFiltersCount }: TennisFiltersProps) {
  const [isLevelInfoOpen, setIsLevelInfoOpen] = useState(false);

  const handleReset = () => {
    onFilterChange({
      timeOfDay: [],
      level: [],
    });
  };

  const toggleTimeOfDay = (value: string) => {
    const newTimeOfDay = filters.timeOfDay.includes(value)
      ? filters.timeOfDay.filter((t) => t !== value)
      : [...filters.timeOfDay, value];
    onFilterChange({ ...filters, timeOfDay: newTimeOfDay });
  };

  const toggleLevel = (value: string) => {
    const newLevel = filters.level.includes(value)
      ? filters.level.filter((l) => l !== value)
      : [...filters.level, value];
    onFilterChange({ ...filters, level: newLevel });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            <h2 className="font-semibold text-sm">Фильтры</h2>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-900 h-7 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Сбросить
            </Button>
          )}
        </div>

        {/* Все фильтры в одну строку на больших экранах, в столбец на маленьких */}
        <div className="space-y-3">
          {/* Время суток - кнопки */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-600">Время суток</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={filters.timeOfDay.includes('morning') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTimeOfDay('morning')}
                className="flex items-center justify-center gap-1.5 h-9 text-sm"
              >
                <Sun className="w-4 h-4" />
                Утро
              </Button>
              <Button
                variant={filters.timeOfDay.includes('afternoon') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTimeOfDay('afternoon')}
                className="flex items-center justify-center gap-1.5 h-9 text-sm"
              >
                <Cloud className="w-4 h-4" />
                День
              </Button>
              <Button
                variant={filters.timeOfDay.includes('evening') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTimeOfDay('evening')}
                className="flex items-center justify-center gap-1.5 h-9 text-sm"
              >
                <Moon className="w-4 h-4" />
                Вечер
              </Button>
            </div>
          </div>

          {/* Уровень игры - кнопки */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label className="text-xs text-gray-600">Уровень игры</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLevelInfoOpen(true)}
                className="text-blue-600 hover:text-blue-800 h-5 px-0.5 text-xs -ml-1"
              >
                <Info className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={filters.level.includes('beginner') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLevel('beginner')}
                className="h-9 text-sm px-2"
              >
                0-1
              </Button>
              <Button
                variant={filters.level.includes('beginner_plus') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLevel('beginner_plus')}
                className="h-9 text-sm px-2"
              >
                1.5-2
              </Button>
              <Button
                variant={filters.level.includes('intermediate') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLevel('intermediate')}
                className="h-9 text-sm px-2"
              >
                2.5-3
              </Button>
              <Button
                variant={filters.level.includes('advanced') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLevel('advanced')}
                className="h-9 text-sm px-2"
              >
                3-3.5
              </Button>
              <Button
                variant={filters.level.includes('advanced_plus') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleLevel('advanced_plus')}
                className="h-9 text-sm px-1.5"
              >
                4+
              </Button>
            </div>
          </div>
        </div>
      </div>
      <LevelInfoDrawer isOpen={isLevelInfoOpen} onClose={() => setIsLevelInfoOpen(false)} />
    </>
  );
}