import { Phone, MessageCircle, Copy, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { toast } from 'sonner';

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  trainerContact: string;
  onContactMe: () => void;
  isContactSending?: boolean;
}

export function BookingDialog({ 
  isOpen, 
  onClose, 
  trainerName, 
  trainerContact,
  onContactMe,
  isContactSending = false,
}: BookingDialogProps) {
  const hasContact = trainerContact.trim().length > 0;
  const displayName = trainerName.trim() || 'Тренер';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Запись на занятие</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Выберите способ связи с тренером
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              Вы можете связаться с тренером <span className="font-semibold">{displayName}</span> напрямую
            </p>
          </div>

          {/* Контакт тренера */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600">Контакт тренера</p>
                  <p className="font-semibold text-blue-700 truncate">
                    {hasContact ? trainerContact : 'Не указан'}
                  </p>
                </div>
              </div>
              {hasContact && (
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(trainerContact);
                    toast.success('Контакт скопирован');
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">или</span>
            </div>
          </div>

          {/* Кнопка связаться со мной */}
          <div className="space-y-3">
            {!hasContact && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                У этой группы не указан контакт тренера. Заявку отправить нельзя — обратитесь к организатору или выберите другую тренировку.
              </p>
            )}
            <Button
              onClick={onContactMe}
              disabled={isContactSending || !hasContact}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isContactSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              {isContactSending ? 'Отправка...' : 'Связаться со мной'}
            </Button>
            <p className="text-xs text-center text-gray-500">
              Тренер свяжется с вами в ближайшее время
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}