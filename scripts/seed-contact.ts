import prisma from "@duran-chatbot/database";

/**
 * One-time seed: copies the company contact details that currently live inside
 * the AI system prompt into the structured appearance.contact* fields so the
 * new "Contact & Location" admin panel is pre-filled and editable.
 */
async function seed() {
  const profile = await prisma.profile.findUnique({
    where: { slug: "duran-schulze" },
    include: { config: true },
  });
  if (!profile?.config) {
    console.log("No duran-schulze config found — nothing to seed.");
    return;
  }

  const appearance = (profile.config.appearance ?? {}) as Record<string, unknown>;
  const next = {
    ...appearance,
    companyAddress:
      (appearance.companyAddress as string | undefined) ||
      "1210 High Street South Corporate Plaza Tower 2, 26th Street, Bonifacio Global City, Taguig, Metro Manila, Philippines",
    companyPhone:
      (appearance.companyPhone as string | undefined) ||
      "(+632) 8478 5826, (+63) 917 194 0482",
    companyEmail:
      (appearance.companyEmail as string | undefined) || "info@duranschulze.com",
    officeHours: (appearance.officeHours as string | undefined) || "",
    contactUrl:
      (appearance.contactUrl as string | undefined) || "https://duranschulze.com/contact/",
    mapUrl: (appearance.mapUrl as string | undefined) || "",
  };

  await prisma.config.update({
    where: { profileId: "duran-schulze" },
    data: { appearance: next as object },
  });
  console.log("Seeded contact fields for duran-schulze:");
  console.log(JSON.stringify(next, null, 2));
  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
