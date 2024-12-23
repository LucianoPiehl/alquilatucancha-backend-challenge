import { Body, Controller, Post, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UseZodGuard, ZodValidationException } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { ClubUpdatedEvent } from '../../domain/events/club-updated.event';
import { CourtUpdatedEvent } from '../../domain/events/court-updated.event';
import { SlotBookedEvent } from '../../domain/events/slot-booked.event';
import { SlotAvailableEvent } from '../../domain/events/slot-cancelled.event';

const SlotSchema = z.object({
  price: z.number(),
  duration: z.number(),
  datetime: z.string(),
  start: z.string(),
  end: z.string(),
  _priority: z.number(),
});

export const ExternalEventSchema = z.union([
  z.object({
    type: z.enum(['booking_cancelled', 'booking_created']),
    clubId: z.number().int(),
    courtId: z.number().int(),
    slot: SlotSchema,
  }),
  z.object({
    type: z.literal('club_updated'),
    clubId: z.number().int(),
    fields: z.array(
      z.enum(['attributes', 'openhours', 'logo_url', 'background_url']),
    ),
  }),
  z.object({
    type: z.literal('court_updated'),
    clubId: z.number().int(),
    courtId: z.number().int(),
    fields: z.array(z.enum(['attributes', 'name'])),
  }),
]);

export type ExternalEventDTO = z.infer<typeof ExternalEventSchema>;

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private eventBus: EventBus) {}

  @Post()
  async receiveEvent(@Body() body: any) {
    this.logger.debug(
      `Received event on /events endpoint: ${JSON.stringify(body)}`,
    );

    try {
      const externalEvent: ExternalEventDTO = ExternalEventSchema.parse(body);

      switch (externalEvent.type) {
        case 'booking_created':
          this.eventBus.publish(
            new SlotBookedEvent(
              externalEvent.clubId,
              externalEvent.courtId,
              externalEvent.slot,
            ),
          );
          break;
        case 'booking_cancelled':
          this.eventBus.publish(
            new SlotAvailableEvent(
              externalEvent.clubId,
              externalEvent.courtId,
              externalEvent.slot,
            ),
          );
          break;
        case 'club_updated':
          this.eventBus.publish(
            new ClubUpdatedEvent(externalEvent.clubId, externalEvent.fields),
          );
          break;
        case 'court_updated':
          this.eventBus.publish(
            new CourtUpdatedEvent(
              externalEvent.clubId,
              externalEvent.courtId,
              externalEvent.fields,
            ),
          );
          break;
        default: {
          const _exhaustiveCheck: never = externalEvent;
          this.logger.warn(
            `Unknown event type: ${JSON.stringify(_exhaustiveCheck)}`,
          );
          break;
        }
      }
    } catch (error) {
        if (error instanceof ZodValidationException) {
          this.logger.error(
            `Validation failed: ${JSON.stringify((error as any).issues)}`,
          );
        }
        else {
        this.logger.error('Unexpected error: ', error);
      }
    }
  }
}