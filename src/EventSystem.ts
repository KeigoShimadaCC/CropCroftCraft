import type { CropType } from './CropSystem';

export type EventType = 'MARKET' | 'SPRING_FESTIVAL' | 'SUMMER_FESTIVAL' | 'FALL_FESTIVAL' | 'WINTER_FESTIVAL';
export type Season = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';

interface EventData {
  name: string;
  description: string;
  duration: number; // Number of days the event lasts
  frequency: number; // How often it occurs (in days), 0 for seasonal
}

const EVENT_DATA: Record<EventType, EventData> = {
  MARKET: {
    name: 'Weekly Market',
    description: 'The traveling merchant has arrived! Sell your crops and resources for coins.',
    duration: 1,
    frequency: 7, // Every 7 days (weekly)
  },
  SPRING_FESTIVAL: {
    name: 'Spring Planting Festival',
    description: 'Celebrate the new growing season! Receive bonus seeds and participate in planting contests.',
    duration: 2,
    frequency: 0, // Seasonal
  },
  SUMMER_FESTIVAL: {
    name: 'Summer Harvest Festival',
    description: 'Celebrate the abundant summer harvest! Show off your best crops.',
    duration: 2,
    frequency: 0, // Seasonal
  },
  FALL_FESTIVAL: {
    name: 'Fall Gathering Festival',
    description: 'Prepare for winter together! Share resources and stories with the community.',
    duration: 2,
    frequency: 0, // Seasonal
  },
  WINTER_FESTIVAL: {
    name: 'Winter Lights Festival',
    description: 'Brighten the dark winter nights! Celebrate friendship and warmth.',
    duration: 2,
    frequency: 0, // Seasonal
  },
};

// Crop and resource prices at market
export const MARKET_PRICES: Record<CropType | 'EGG' | 'MILK' | 'WOOL', number> = {
  WHEAT: 5,
  CARROT: 8,
  TOMATO: 10,
  EGG: 3,
  MILK: 6,
  WOOL: 12,
};

export interface ActiveEvent {
  type: EventType;
  startDay: number;
  endDay: number;
}

export class EventSystem {
  private activeEvent: ActiveEvent | null = null;
  private lastMarketDay: number = 0;
  private coins: number = 0; // Player's currency
  private onEventStart: ((event: ActiveEvent) => void) | null = null;
  private onEventEnd: ((event: ActiveEvent) => void) | null = null;

  constructor() {
    // Start with some coins
    this.coins = 50;
  }

  update(currentDay: number): void {
    // Check if current event has ended
    if (this.activeEvent && currentDay > this.activeEvent.endDay) {
      if (this.onEventEnd) {
        this.onEventEnd(this.activeEvent);
      }
      this.activeEvent = null;
    }

    // Check for new events if none active
    if (!this.activeEvent) {
      // Check for weekly market
      if (currentDay - this.lastMarketDay >= 7 && currentDay % 7 === 0) {
        this.startEvent('MARKET', currentDay);
        this.lastMarketDay = currentDay;
      }

      // Check for seasonal festivals (every 30 days, rotating seasons)
      if (currentDay % 30 === 0 && currentDay > 0) {
        const season = this.getCurrentSeason(currentDay);
        let eventType: EventType;

        switch (season) {
          case 'SPRING':
            eventType = 'SPRING_FESTIVAL';
            break;
          case 'SUMMER':
            eventType = 'SUMMER_FESTIVAL';
            break;
          case 'FALL':
            eventType = 'FALL_FESTIVAL';
            break;
          case 'WINTER':
            eventType = 'WINTER_FESTIVAL';
            break;
        }

        this.startEvent(eventType, currentDay);
      }
    }
  }

  private startEvent(type: EventType, startDay: number): void {
    const data = EVENT_DATA[type];
    this.activeEvent = {
      type,
      startDay,
      endDay: startDay + data.duration - 1,
    };

    if (this.onEventStart) {
      this.onEventStart(this.activeEvent);
    }
  }

  getCurrentSeason(day: number): Season {
    const cycle = Math.floor(day / 30) % 4;
    switch (cycle) {
      case 0:
        return 'SPRING';
      case 1:
        return 'SUMMER';
      case 2:
        return 'FALL';
      case 3:
        return 'WINTER';
      default:
        return 'SPRING';
    }
  }

  getSeasonEmoji(season: Season): string {
    switch (season) {
      case 'SPRING':
        return '🌸';
      case 'SUMMER':
        return '☀️';
      case 'FALL':
        return '🍂';
      case 'WINTER':
        return '❄️';
      default:
        return '🌱';
    }
  }

  getActiveEvent(): ActiveEvent | null {
    return this.activeEvent;
  }

  getEventData(type: EventType): EventData {
    return EVENT_DATA[type];
  }

  // Market functionality
  sellItem(itemType: CropType | 'EGG' | 'MILK' | 'WOOL', amount: number): number {
    if (!this.isMarketActive()) {
      return 0;
    }

    const price = MARKET_PRICES[itemType];
    const earnings = price * amount;
    this.coins += earnings;
    return earnings;
  }

  isMarketActive(): boolean {
    return this.activeEvent?.type === 'MARKET';
  }

  isFestivalActive(): boolean {
    if (!this.activeEvent) return false;
    return ['SPRING_FESTIVAL', 'SUMMER_FESTIVAL', 'FALL_FESTIVAL', 'WINTER_FESTIVAL'].includes(this.activeEvent.type);
  }

  getCoins(): number {
    return this.coins;
  }

  // Festival rewards
  claimFestivalReward(type: EventType): { seeds?: { type: CropType; amount: number }; coins?: number } | null {
    if (!this.activeEvent || this.activeEvent.type !== type) {
      return null;
    }

    switch (type) {
      case 'SPRING_FESTIVAL':
        // Bonus seeds for planting
        return { seeds: { type: 'WHEAT', amount: 5 }, coins: 20 };
      case 'SUMMER_FESTIVAL':
        // Bonus coins for harvest
        return { coins: 50 };
      case 'FALL_FESTIVAL':
        // Mixed rewards
        return { seeds: { type: 'CARROT', amount: 3 }, coins: 30 };
      case 'WINTER_FESTIVAL':
        // Bonus coins for community
        return { coins: 40 };
      default:
        return null;
    }
  }

  registerEventCallbacks(
    onStart: (event: ActiveEvent) => void,
    onEnd: (event: ActiveEvent) => void
  ): void {
    this.onEventStart = onStart;
    this.onEventEnd = onEnd;
  }
}
