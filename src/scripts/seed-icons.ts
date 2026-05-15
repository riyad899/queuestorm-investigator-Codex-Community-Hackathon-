import { prisma } from "../app/lib/prisma.js";

const icons = [
  {
    name: "Desktop",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="14" rx="2" ry="2"></rect><line x1="8" y1="22" x2="16" y2="22"></line><line x1="12" y1="16" x2="12" y2="22"></line><line x1="4" y1="9" x2="20" y2="9"></line></svg>',
  },
  {
    name: "Laptop",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line><line x1="8" y1="3" x2="16" y2="3"></line></svg>',
  },
  {
    name: "Component",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>',
  },
  {
    name: "Monitor",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
  },
  {
    name: "Power",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64A9 9 0 0 1 20.77 15"></path><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"></path><line x1="12" y1="2" x2="12" y2="12"></line><path d="M12 22v-4"></path><path d="M2 12h4"></path><path d="M18 12h4"></path></svg>',
  },
  {
    name: "Phone",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
  },
  {
    name: "Tablet",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
  },
  {
    name: "Office Equipment",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><rect x="6" y="8" width="12" height="6"></rect><line x1="8" y1="20" x2="16" y2="20"></line><line x1="12" y1="14" x2="12" y2="20"></line><circle cx="8" cy="11" r="1"></circle><circle cx="16" cy="11" r="1"></circle></svg>',
  },
  {
    name: "Camera",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  },
  {
    name: "Security",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 6v6c0 6 9 10 9 10s9-4 9-10V6l-9-4z"></path><path d="M12 12v4"></path><circle cx="12" cy="9" r="1"></circle><line x1="12" y1="9" x2="12" y2="12"></line></svg>',
  },
  {
    name: "Networking",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="6" r="3"></circle><circle cx="18" cy="18" r="3"></circle><line x1="9" y1="16" x2="15" y2="8"></line><line x1="15" y1="16" x2="9" y2="8"></line></svg>',
  },
  {
    name: "Software",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><path d="M8 8l4 4-4 4"></path><path d="M16 8l-4 4 4 4"></path></svg>',
  },
  {
    name: "Server & Storage",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="16" x2="16" y2="16"></line><rect x="6" y="19" width="12" height="2"></rect><line x1="4" y1="2" x2="20" y2="2"></line></svg>',
  },
  {
    name: "Accessories",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.04.04A10 10 0 0 0 12 17.66a10 10 0 0 0 6.36-2.62z"></path><path d="M16.5 9.4a4 4 0 0 0-9 0"></path><path d="M18.5 5.5a8 8 0 0 0-13 0"></path></svg>',
  },
  {
    name: "Gadget",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2"></rect><line x1="10" y1="8" x2="14" y2="8"></line><line x1="10" y1="12" x2="14" y2="12"></line><line x1="10" y1="16" x2="14" y2="16"></line><circle cx="12" cy="20" r="1"></circle><path d="M8 2h8"></path></svg>',
  },
  {
    name: "Gaming",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="12" rx="2"></rect><circle cx="7" cy="14" r="2"></circle><circle cx="17" cy="14" r="2"></circle><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  },
  {
    name: "TV",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="12" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="19" x2="12" y2="21"></line></svg>',
  },
  {
    name: "Appliance",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"></rect><line x1="9" y1="7" x2="15" y2="7"></line><line x1="9" y1="11" x2="15" y2="11"></line><line x1="9" y1="15" x2="12" y2="15"></line><circle cx="16" cy="17" r="1"></circle></svg>',
  },
  {
    name: "Smartphone",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
  },
  {
    name: "Drone",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 9v-3M19 12h-3M5 12H2M12 19v-3M9 15l-2 2M15 15l2 2M9 9L7 7M15 9l2-2"></path></svg>',
  },
  {
    name: "Generator",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"></rect><line x1="8" y1="18" x2="8" y2="22"></line><line x1="16" y1="18" x2="16" y2="22"></line><path d="M7 6h10l2 4H5l2-4z"></path><circle cx="12" cy="10" r="1"></circle><line x1="9" y1="2" x2="9" y2="6"></line><line x1="15" y1="2" x2="15" y2="6"></line></svg>',
  },
  {
    name: "Drone Camera",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 9v-3M19 12h-3M5 12H2M12 19v-3"></path><path d="M8.5 10.5L7 9M15.5 10.5L17 9M8.5 13.5L7 15M15.5 13.5L17 15"></path><circle cx="12" cy="12" r="8"></circle><line x1="12" y1="2" x2="12" y2="0"></line></svg>',
  },
  {
    name: "Action Camera",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="9" x2="22" y2="9"></line><circle cx="9" cy="12" r="2"></circle><path d="M15 12h4"></path><rect x="8" y="19" width="8" height="2"></rect></svg>',
  },
  {
    name: "Headphone",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="4" height="10" rx="1"></rect><rect x="16" y="9" width="4" height="10" rx="1"></rect><path d="M8 9v-2a4 4 0 0 1 8 0v2"></path></svg>',
  },
  {
    name: "Storage",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01"></path></svg>',
  },
  {
    name: "Trimmer",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="6" rx="1"></rect><path d="M9 8v3a3 3 0 0 0 6 0V8"></path><line x1="12" y1="13" x2="12" y2="22"></line><line x1="7" y1="19" x2="17" y2="19"></line></svg>',
  },
  {
    name: "Smart Watch",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"></circle><rect x="9" y="2" width="6" height="5" rx="1"></rect><rect x="9" y="17" width="6" height="5" rx="1"></rect></svg>',
  },
  {
    name: "Speaker",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><circle cx="12" cy="14" r="4"></circle><line x1="12" y1="6" x2="12.01" y2="6"></line></svg>',
  },
] as const;

const main = async () => {
  const existing = await prisma.icon.findMany({
    select: { name: true },
  });

  const existingNames = new Set(existing.map((i) => i.name));
  const toCreate = icons.filter((icon) => !existingNames.has(icon.name));

  if (toCreate.length === 0) {
    console.log("No new icons to seed (all names already exist)");
    return;
  }

  const result = await prisma.icon.createMany({
    data: toCreate.map((icon) => ({
      name: icon.name,
      svg: icon.svg,
    })),
  });

  console.log(`Seeded icons: ${result.count}`);
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
