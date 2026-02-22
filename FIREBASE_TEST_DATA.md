# Тестовые данные для Firebase

## Примеры документов для коллекции `groupTrainings`

Вы можете добавить эти данные вручную в Firebase Console → Firestore Database → Коллекция `groupTrainings`.

### Пример 1: Групповая тренировка для начинающих (повторяющаяся)

```json
{
  "userId": 1,
  "trainerName": "Софья Карбышева",
  "courtName": "ТК Коломенский",
  "dateTime": "27.02 19:00",
  "isRecurring": true,
  "duration": 1.5,
  "groupSize": "3-4",
  "level": "beginner",
  "priceSingle": 2950,
  "contact": "@sophya_tennis",
  "isActive": true
}
```

**Примечание:** 
- `isRecurring: true` означает, что занятие повторяется каждую неделю
- Приложение автоматически вычислит ближайшую дату на основе дня недели
- Например, если `27.02` - это четверг, то покажется ближайший будущий четверг
- `createdAt` будет автоматически добавлен Firestore как Timestamp

### Пример 2: Продвинутая группа

```json
{
  "userId": 2,
  "trainerName": "Алексей Смирнов",
  "courtName": "ТК Лужники",
  "dateTime": "28.02 10:00",
  "isRecurring": true,
  "duration": 2,
  "groupSize": "5-6",
  "level": "advanced_plus",
  "priceSingle": 3500,
  "contact": "+7 (999) 123-45-67",
  "isActive": true
}
```

### Пример 3: Средний уровень

```json
{
  "userId": 3,
  "trainerName": "Мария Петрова",
  "courtName": "ТК Олимпийский",
  "dateTime": "01.03 14:00",
  "isRecurring": false,
  "duration": 1.5,
  "groupSize": "3-4",
  "level": "intermediate",
  "priceSingle": 2500,
  "contact": "@maria_tennis",
  "isActive": true
}
```

---

## Примеры документов для коллекции `users`

Вы можете добавить эти данные вручную в Firebase Console → Firestore Database → Коллекция `users`.

**ВАЖНО:** ID документа должен быть уникальным (можно использовать автоматический ID или использовать телефон/email).

### Пример 1: Профиль тренера Софьи

Document ID: `user_sophya` (или любой другой уникальный ID)

```json
{
  "name": "Софья",
  "phone": "+7 (999) 111-22-33",
  "city": "Москва",
  "isCoach": true,
  "coachName": "Софья Карбышева",
  "coachDistricts": ["ЦАО", "ЮАО"],
  "coachPriceIndividual": 4000,
  "coachPriceSplit": 3000,
  "coachPriceGroup": 2950,
  "coachAvailableDays": ["Пн", "Ср", "Пт", "Вс"],
  "coachMedia": [
    {
      "type": "photo",
      "fileId": "AgACAgIAAxkBAAI...",
      "publicUrl": "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
      "uploadedAt": "2024-02-22T10:30:00.000Z"
    }
  ],
  "coachAbout": "Профессиональный тренер по теннису с 8-летним опытом. Специализируюсь на работе с начинающими игроками. Имею сертификат PTR (Professional Tennis Registry). Помогу освоить технику удара, научу правильной стратегии игры и подготовлю к турнирам.",
  "coachContact": "@sophya_tennis",
  "coachHidden": false
}
```

### Пример 2: Профиль тренера Алексея

Document ID: `user_alexey` (или любой другой уникальный ID)

```json
{
  "name": "Алексей",
  "phone": "+7 (999) 222-33-44",
  "city": "Москва",
  "isCoach": true,
  "coachName": "Алексей Смирнов",
  "coachDistricts": ["ЦАО", "ЗАО", "САО"],
  "coachPriceIndividual": 5000,
  "coachPriceSplit": 4000,
  "coachPriceGroup": 3500,
  "coachAvailableDays": ["Вт", "Чт", "Сб", "Вс"],
  "coachMedia": [
    {
      "type": "photo",
      "fileId": "AgACAgIAAxkBAAI...",
      "publicUrl": "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800",
      "uploadedAt": "2024-02-22T11:00:00.000Z"
    }
  ],
  "coachAbout": "Мастер спорта по теннису, тренер высшей категории. 15 лет опыта работы с игроками уровня 3.0-5.0. Работал с юниорами национальной сборной. Индивидуальный подход, современные методики тренировок.",
  "coachContact": "+7 (999) 222-33-44",
  "coachHidden": false
}
```

### Пример 3: Профиль тренера Марии

Document ID: `user_maria` (или любой другой уникальный ID)

```json
{
  "name": "Мария",
  "phone": "+7 (999) 333-44-55",
  "city": "Москва",
  "isCoach": true,
  "coachName": "Мария Петрова",
  "coachDistricts": ["ЦАО", "СВАО"],
  "coachPriceIndividual": 3500,
  "coachPriceSplit": 2800,
  "coachPriceGroup": 2500,
  "coachAvailableDays": ["Пн", "Ср", "Чт", "Сб"],
  "coachMedia": [
    {
      "type": "photo",
      "fileId": "AgACAgIAAxkBAAI...",
      "publicUrl": "https://images.unsplash.com/photo-1616428153678-60e66ba6c16d?w=800",
      "uploadedAt": "2024-02-22T12:00:00.000Z"
    }
  ],
  "coachAbout": "КМС по теннису, опыт тренерской работы 10 лет. Специализируюсь на технической подготовке и тактике игры. Работаю с детьми и взрослыми всех уровней. Провожу индивидуальные и групповые тренировки.",
  "coachContact": "@maria_tennis",
  "coachHidden": false
}
```

---

## Как добавить данные в Firebase Console

### Способ 1: Вручную через интерфейс

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Перейдите в **Firestore Database**
4. Нажмите **Start collection** (если коллекция не существует) или откройте существующую коллекцию
5. Введите название коллекции: `groupTrainings` или `users`
6. Нажмите **Auto-ID** для автоматической генерации ID документа
7. Добавьте поля вручную:
   - Нажмите **Add field**
   - Введите имя поля и выберите тип данных
   - Введите значение
   - Повторите для всех полей
8. Нажмите **Save**

### Способ 2: Импорт через Firebase CLI (если настроен)

Если у вас настроен Firebase CLI, вы можете создать скрипт для автоматического добавления данных.

---

## Полезные ссылки

- [Unsplash](https://unsplash.com/s/photos/tennis-player) - бесплатные фото теннисистов
- [Firebase Console](https://console.firebase.google.com/) - управление базой данных
- [Firestore Data Types](https://firebase.google.com/docs/firestore/manage-data/data-types) - типы данных Firestore