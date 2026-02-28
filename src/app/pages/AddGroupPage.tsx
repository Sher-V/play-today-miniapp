import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GroupRegistrationFlow, type TrainerAtCourt } from '../components/GroupRegistrationFlow';
import { AfterGroupSubmitScreen } from '../components/AfterGroupSubmitScreen';
import { AddClubTrainerForm, type NewlyCreatedClubTrainer } from '../components/AddClubTrainerForm';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { useTelegram } from '../../hooks/useTelegram';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { GroupCreatorRole } from '../../lib/groupRegistrationStorage';

function toTrainerAtCourt(t: NewlyCreatedClubTrainer): TrainerAtCourt {
  return {
    id: `c-${t.id}`,
    clubTrainerId: t.id,
    trainerName: t.coachName,
    coachName: t.coachName,
    contact: t.contact,
    coachPhotoUrl: t.coachPhotoUrl,
    coachAbout: t.coachAbout,
  };
}

export function AddGroupPage() {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegram();
  const userIdStr = telegramUser?.id != null ? String(telegramUser.id) : undefined;
  const { profile } = useUserProfile(userIdStr);
  const [afterSubmitRole, setAfterSubmitRole] = useState<GroupCreatorRole | null>(null);
  const [afterSubmitGroupId, setAfterSubmitGroupId] = useState<string | null>(null);
  const [trainerWasExisting, setTrainerWasExisting] = useState(false);
  const [screen, setScreen] = useState<'form' | 'after'>('form');
  const [showAddClubTrainerSheet, setShowAddClubTrainerSheet] = useState(false);
  const [addClubTrainerInitialName, setAddClubTrainerInitialName] = useState<string | undefined>();
  const [newlyCreatedTrainer, setNewlyCreatedTrainer] = useState<TrainerAtCourt | null>(null);

  const telegramUserName = [telegramUser?.first_name, telegramUser?.last_name]
    .filter(Boolean)
    .join(' ') || 'Тренер';

  if (screen === 'after' && afterSubmitRole) {
    return (
      <AfterGroupSubmitScreen
        role={afterSubmitRole}
        groupId={afterSubmitGroupId ?? undefined}
        telegramUserId={telegramUser?.id}
        trainerWasExisting={trainerWasExisting}
        onBack={() => navigate('/my-groups')}
        onRegisterCoach={() => {
          const gid = afterSubmitGroupId ?? undefined;
          const path = gid ? `/register-coach?fromGroupId=${encodeURIComponent(gid)}` : '/register-coach';
          navigate(path, { state: gid ? { fromGroupId: gid } : undefined });
        }}
        onAddAnotherGroup={() => {
          setScreen('form');
          setAfterSubmitRole(null);
          setAfterSubmitGroupId(null);
          setTrainerWasExisting(false);
        }}
      />
    );
  }

  return (
    <>
      <GroupRegistrationFlow
        telegramUserId={telegramUser?.id}
        telegramUserName={telegramUserName}
        coachContactFromProfile={profile?.coachContact}
        onSuccess={(role, groupId, opts) => {
          setAfterSubmitRole(role);
          setAfterSubmitGroupId(groupId);
          setTrainerWasExisting(opts?.trainerWasExisting ?? false);
          setScreen('after');
        }}
        onBack={() => navigate('/')}
        onAddClubTrainerRequest={
          telegramUser?.id
            ? (initialName) => {
                setAddClubTrainerInitialName(initialName);
                setShowAddClubTrainerSheet(true);
              }
            : undefined
        }
        newlyCreatedTrainer={newlyCreatedTrainer}
        onClearNewlyCreatedTrainer={() => setNewlyCreatedTrainer(null)}
      />
      <Sheet
        open={showAddClubTrainerSheet}
        onOpenChange={(open) => {
          setShowAddClubTrainerSheet(open);
          if (!open) setAddClubTrainerInitialName(undefined);
        }}
      >
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          {telegramUser?.id && (
            <AddClubTrainerForm
              adminUserId={telegramUser.id}
              initialCoachName={addClubTrainerInitialName}
              onSuccess={(trainer) => {
                setNewlyCreatedTrainer(toTrainerAtCourt(trainer));
                setShowAddClubTrainerSheet(false);
                setAddClubTrainerInitialName(undefined);
              }}
              onCancel={() => {
                setShowAddClubTrainerSheet(false);
                setAddClubTrainerInitialName(undefined);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
