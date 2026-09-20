-- FlexiGo — expand supported Algerian shipping-provider catalog.
-- Provider adapters without verified public API documentation remain safely
-- configuration-only: credentials are encrypted, and automatic shipment calls
-- stay disabled until their official endpoint contract is implemented.

alter table public.shipping_integrations
  drop constraint if exists shipping_integrations_provider_key_check;

alter table public.shipping_integrations
  add constraint shipping_integrations_provider_key_check
  check (provider_key in (
    'manual','navex','yalidine','guepex','yalitec','ecotrack','zr',
    'ecom_delivery','abex','colireli','colireli_ecotrack','isr','leopard',
    'generic','mock'
  ));
