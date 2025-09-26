-- AlterTable
CREATE SEQUENCE webhookevent_id_seq;
ALTER TABLE "WebhookEvent" ALTER COLUMN "id" SET DEFAULT nextval('webhookevent_id_seq');
ALTER SEQUENCE webhookevent_id_seq OWNED BY "WebhookEvent"."id";
