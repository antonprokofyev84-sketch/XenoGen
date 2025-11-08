import { useGameState } from '@/state/useGameState';

import './TimeDisplay.scss';

// Хелпер для форматирования времени
const formatTime = (timestamp: number): { day: number; time: string } => {
  const date = new Date(timestamp);
  const day =
    Math.floor((timestamp - new Date('2069-05-10T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return {
    day,
    time: `${hours}:${minutes}`,
  };
};

export const TimeDisplay = () => {
  const currentTime = useGameState((state) => state.world.currentTime);
  const { day, time } = formatTime(currentTime);

  return (
    <div className="timeDisplay">
      <div className="dayLabel">Day {day}</div>
      <div className="timeLabel">{time}</div>
    </div>
  );
};
