export interface SeedStoreData {
  name: string;
  brand: string;
  address: string;
  openHours: string;
  phone: string;
  logo?: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export const SEED_STORES: SeedStoreData[] = [
  {
    name: "WinMart+ Nguyễn Thị Minh Khai",
    brand: "WinMart",
    address: "123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1, TP.HCM",
    openHours: "06:00 - 22:00",
    phone: "028 7108 1368",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/winmart.png",
    location: {
      type: "Point",
      coordinates: [106.6909, 10.7769], // [lng, lat]
    },
  },
  {
    name: "Co.opmart Cống Quỳnh",
    brand: "Co.opmart",
    address: "189C Cống Quỳnh, P. Nguyễn Cư Trinh, Quận 1, TP.HCM",
    openHours: "07:30 - 22:00",
    phone: "028 3832 5288",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/coopmart.png",
    location: {
      type: "Point",
      coordinates: [106.6892, 10.7676],
    },
  },
  {
    name: "Annam Gourmet Hai Bà Trưng",
    brand: "Annam Gourmet",
    address: "16-18 Hai Bà Trưng, P. Bến Nghé, Quận 1, TP.HCM",
    openHours: "07:00 - 22:00",
    phone: "028 3822 9332",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/annam.png",
    location: {
      type: "Point",
      coordinates: [106.6989, 10.7831],
    },
  },
  {
    name: "Co.opXtra Vạn Hạnh Mall",
    brand: "Co.opXtra",
    address: "Tầng B1 Vạn Hạnh Mall, 11 Sư Vạn Hạnh, Phường 12, Quận 10, TP.HCM",
    openHours: "08:00 - 22:00",
    phone: "028 3862 3888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/coopxtra.png",
    location: {
      type: "Point",
      coordinates: [106.6698, 10.7711],
    },
  },
  {
    name: "Bách Hóa Xanh Điện Biên Phủ",
    brand: "Bách Hóa Xanh",
    address: "142 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM",
    openHours: "06:30 - 21:30",
    phone: "1900 1908",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bachhoaxanh.png",
    location: {
      type: "Point",
      coordinates: [106.7118, 10.7988],
    },
  },
  {
    name: "WinMart Landmark 81",
    brand: "WinMart",
    address: "Tầng B1 Vincom Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM",
    openHours: "08:00 - 22:00",
    phone: "028 3636 8181",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/winmart.png",
    location: {
      type: "Point",
      coordinates: [106.7218, 10.7951],
    },
  },
  {
    name: "Emart Sala Thủ Thiêm",
    brand: "Emart",
    address: "Tầng B1 Thiso Mall, 10 Mai Chí Thọ, Phường Thủ Thiêm, TP. Thủ Đức, TP.HCM",
    openHours: "07:30 - 22:30",
    phone: "028 3622 9999",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/emart.png",
    location: {
      type: "Point",
      coordinates: [106.7215, 10.7712],
    },
  },
  {
    name: "Tops Market An Phú",
    brand: "Tops Market",
    address: "Tầng B1, TTTM Estella Place, 88 Song Hành, Phường An Phú, TP. Thủ Đức, TP.HCM",
    openHours: "08:00 - 22:00",
    phone: "028 3620 4888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/topsmarket.png",
    location: {
      type: "Point",
      coordinates: [106.7412, 10.8035],
    },
  },
  {
    name: "Lotte Mart Nam Sài Gòn",
    brand: "Lotte Mart",
    address: "469 Nguyễn Hữu Thọ, P. Tân Hưng, Quận 7, TP.HCM",
    openHours: "07:30 - 22:00",
    phone: "028 3775 3232",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/lottemart.png",
    location: {
      type: "Point",
      coordinates: [106.7022, 10.7351],
    },
  },
  {
    name: "Co.opmart Hùng Vương",
    brand: "Co.opmart",
    address: "96 Hùng Vương, Phường 9, Quận 5, TP.HCM",
    openHours: "07:30 - 22:00",
    phone: "028 3835 1588",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/coopmart.png",
    location: {
      type: "Point",
      coordinates: [106.6669, 10.7571],
    },
  },
];
