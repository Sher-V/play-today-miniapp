import { X, Phone, MessageCircle, Mail, Award, Calendar, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';
import { Badge } from './ui/badge';
import Slider from 'react-slick';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string; // для видео
}

export interface TrainerInfo {
  id: string;
  name: string;
  photo?: string; // оставляем для обратной совместимости
  media?: MediaItem[]; // новое поле для слайдера
  description: string;
  experience?: string; // опционально
  specialization?: string; // опционально
  contact: string;
}

interface TrainerDrawerProps {
  trainer: TrainerInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onBooking: () => void;
}

export function TrainerDrawer({ trainer, isOpen, onClose, onBooking }: TrainerDrawerProps) {
  if (!trainer) return null;

  // Кастомные стрелки для слайдера
  const CustomPrevArrow = (props: any) => {
    const { onClick } = props;
    return (
      <button
        onClick={onClick}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full p-1 transition-all duration-200"
      >
        <ChevronLeft className="w-4 h-4 text-white" strokeWidth={2.5} />
      </button>
    );
  };

  const CustomNextArrow = (props: any) => {
    const { onClick } = props;
    return (
      <button
        onClick={onClick}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full p-1 transition-all duration-200"
      >
        <ChevronRight className="w-4 h-4 text-white" strokeWidth={2.5} />
      </button>
    );
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: false,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
  };

  // Подготовка медиа для слайдера
  const mediaItems = trainer.media || (trainer.photo ? [{ type: 'image' as const, url: trainer.photo }] : []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0 overflow-hidden flex flex-col">
        <SheetTitle className="sr-only">{trainer.name}</SheetTitle>
        <SheetDescription className="sr-only">
          Информация о тренере {trainer.name}
        </SheetDescription>
        <div className="flex-1 overflow-y-auto">
          {/* Слайдер с фото и видео */}
          <div className="relative h-64 bg-gradient-to-b from-blue-600 to-blue-700">
            {mediaItems.length > 0 && (
              <Slider {...sliderSettings} className="trainer-slider h-full">
                {mediaItems.map((item, index) => (
                  <div key={index} className="h-64">
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`${trainer.name} ${index + 1}`}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="relative h-64">
                        <video
                          src={item.url}
                          poster={item.thumbnail}
                          controls
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </Slider>
            )}
            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors shadow-lg z-10"
            >
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>

          {/* Информация о тренере */}
          <div className="p-6 space-y-6 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{trainer.name}</h2>
            </div>

            {/* Описание */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">О тренере</h3>
              <p className="text-gray-600 leading-relaxed">{trainer.description}</p>
            </div>
          </div>
        </div>

        {/* Кнопка записаться - прибита к низу */}
        <div className="p-6 pt-4 border-t bg-white">
          <Button
            onClick={onBooking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold rounded-xl"
          >
            Записаться на занятие
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}