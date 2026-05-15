import z from "zod";

const nonEmptyOptional = z.string().min(1).optional();

export const upsertFooterSettingZodSchema = z
  .object({
    title: z.string().min(1, "Title is required"),

    address: nonEmptyOptional,
    store: nonEmptyOptional,

    district: nonEmptyOptional,
    // tolerate common typo from frontend/dashboard
    discrict: nonEmptyOptional,

    experience: nonEmptyOptional,
    // tolerate common typo from frontend/dashboard
    exprerience: nonEmptyOptional,

    paymentAccepts: z.array(z.string().min(1)).optional(),

    facebookLink: z.string().url().optional(),
    twitterLink: z.string().url().optional(),
    youtubeLink: z.string().url().optional(),
    whatsappLink: z.string().url().optional(),

    playStoreLink: z.string().url().optional(),
    appleStoreLink: z.string().url().optional(),

    hotline: nonEmptyOptional,
    email: z.string().email().optional(),
    hq: nonEmptyOptional,
  })
  .transform((value) => ({
    title: value.title,
    address: value.address,
    store: value.store,
    district: value.district ?? value.discrict,
    experience: value.experience ?? value.exprerience,
    paymentAccepts: value.paymentAccepts,
    facebookLink: value.facebookLink,
    twitterLink: value.twitterLink,
    youtubeLink: value.youtubeLink,
    whatsappLink: value.whatsappLink,
    playStoreLink: value.playStoreLink,
    appleStoreLink: value.appleStoreLink,
    hotline: value.hotline,
    email: value.email,
    hq: value.hq,
  }));
