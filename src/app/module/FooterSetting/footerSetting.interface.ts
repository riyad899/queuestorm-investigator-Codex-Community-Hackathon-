export interface IUpsertFooterSettingPayload {
  title: string;
  address?: string;
  store?: string;
  district?: string;
  experience?: string;
  paymentAccepts?: string[];

  facebookLink?: string;
  twitterLink?: string;
  youtubeLink?: string;
  whatsappLink?: string;

  playStoreLink?: string;
  appleStoreLink?: string;

  hotline?: string;
  email?: string;
  hq?: string;
}
