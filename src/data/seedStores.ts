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
  // --- QUY NHƠN, BÌNH ĐỊNH ---
  {
    name: "Co.opmart Quy Nhơn",
    brand: "Co.opmart",
    address: "07 Lê Duẩn, P. Lý Thường Kiệt, TP. Quy Nhơn, Bình Định",
    openHours: "07:30 - 22:00",
    phone: "0256 3522 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/coopmart.png",
    location: {
      type: "Point",
      coordinates: [109.2192, 13.7744],
    },
  },
  {
    name: "GO! Quy Nhơn (Big C Kim Cúc Plaza)",
    brand: "Big C",
    address: "Khu Đô Thị Xanh Vũng Chua, P. Ghềnh Ráng, TP. Quy Nhơn, Bình Định",
    openHours: "08:00 - 22:00",
    phone: "0256 3686 688",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bigc.png",
    location: {
      type: "Point",
      coordinates: [109.2155, 13.7583],
    },
  },
  {
    name: "WinMart+ Nguyễn Thái Học Quy Nhơn",
    brand: "WinMart",
    address: "354 Nguyễn Thái Học, P. Ngô Mây, TP. Quy Nhơn, Bình Định",
    openHours: "06:00 - 22:00",
    phone: "0256 7108 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/winmart.png",
    location: {
      type: "Point",
      coordinates: [109.2235, 13.7661],
    },
  },
  {
    name: "WinMart+ An Dương Vương Quy Nhơn",
    brand: "WinMart",
    address: "01 An Dương Vương, P. Nguyễn Văn Cừ, TP. Quy Nhơn, Bình Định",
    openHours: "06:00 - 22:00",
    phone: "0256 7109 999",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/winmart.png",
    location: {
      type: "Point",
      coordinates: [109.2177, 13.7548],
    },
  },
  {
    name: "Bách Hóa Xanh Trần Hưng Đạo Quy Nhơn",
    brand: "Bách Hóa Xanh",
    address: "650 Trần Hưng Đạo, P. Đống Đa, TP. Quy Nhơn, Bình Định",
    openHours: "06:30 - 21:30",
    phone: "1900 1908",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bachhoaxanh.png",
    location: {
      type: "Point",
      coordinates: [109.2312, 13.7788],
    },
  },
  {
    name: "Mega Market Quy Nhơn",
    brand: "Mega Market",
    address: "Quốc Lộ 1D, P. Ghềnh Ráng, TP. Quy Nhơn, Bình Định",
    openHours: "06:00 - 21:30",
    phone: "0256 3546 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/megamarket.png",
    location: {
      type: "Point",
      coordinates: [109.2045, 13.7482],
    },
  },
  // --- ĐÀ NẴNG ---
  {
    name: "GO! Đà Nẵng (Big C)",
    brand: "Big C",
    address: "255-257 Hùng Vương, Vĩnh Trung, Thanh Khê, Đà Nẵng",
    openHours: "08:00 - 22:00",
    phone: "0236 3666 085",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bigc.png",
    location: {
      type: "Point",
      coordinates: [108.2144, 16.0645],
    },
  },
  {
    name: "Co.opmart Đà Nẵng",
    brand: "Co.opmart",
    address: "478 Điện Biên Phủ, Thanh Khê Đông, Thanh Khê, Đà Nẵng",
    openHours: "07:30 - 21:30",
    phone: "0236 3771 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/coopmart.png",
    location: {
      type: "Point",
      coordinates: [108.1876, 16.0617],
    },
  },
  {
    name: "Lotte Mart Đà Nẵng",
    brand: "Lotte Mart",
    address: "06 Nại Nam, Hoà Cường Bắc, Hải Châu, Đà Nẵng",
    openHours: "08:00 - 22:00",
    phone: "0236 3611 999",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/lottemart.png",
    location: {
      type: "Point",
      coordinates: [108.2255, 16.0354],
    },
  },
  // --- HÀ NỘI ---
  {
    name: "Big C Thăng Long (GO!)",
    brand: "Big C",
    address: "222 Trần Duy Hưng, Trung Hòa, Cầu Giấy, Hà Nội",
    openHours: "08:00 - 22:30",
    phone: "024 3784 8596",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bigc.png",
    location: {
      type: "Point",
      coordinates: [105.7925, 21.0084],
    },
  },
  {
    name: "WinMart Tràng Tiền Plaza",
    brand: "WinMart",
    address: "24 Hai Bà Trưng, Tràng Tiền, Hoàn Kiếm, Hà Nội",
    openHours: "08:00 - 22:00",
    phone: "024 3937 8599",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/winmart.png",
    location: {
      type: "Point",
      coordinates: [105.8542, 21.0253],
    },
  },
  {
    name: "BRG Mart Bà Triệu",
    brand: "BRG Mart",
    address: "191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội",
    openHours: "07:30 - 21:30",
    phone: "024 3974 6699",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/brg.png",
    location: {
      type: "Point",
      coordinates: [105.8502, 21.0115],
    },
  },
  // --- NHA TRANG ---
  {
    name: "GO! Nha Trang (Big C)",
    brand: "Big C",
    address: "Lô 4, Đường 19/5, Vĩnh Điềm Trung, TP. Nha Trang, Khánh Hòa",
    openHours: "08:00 - 22:00",
    phone: "0258 3894 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bigc.png",
    location: {
      type: "Point",
      coordinates: [109.1764, 12.2471],
    },
  },
  {
    name: "Co.opmart Nha Trang",
    brand: "Co.opmart",
    address: "02 Lê Hồng Phong, P. Phước Tân, TP. Nha Trang, Khánh Hòa",
    openHours: "07:30 - 22:00",
    phone: "0258 3875 111",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/coopmart.png",
    location: {
      type: "Point",
      coordinates: [109.1842, 12.2536],
    },
  },
  // --- CẦN THƠ ---
  {
    name: "Lotte Mart Cần Thơ",
    brand: "Lotte Mart",
    address: "84 Mậu Thân, An Hòa, Ninh Kiều, Cần Thơ",
    openHours: "08:00 - 22:00",
    phone: "0292 3696 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/lottemart.png",
    location: {
      type: "Point",
      coordinates: [105.7725, 10.0452],
    },
  },
  {
    name: "GO! Cần Thơ (Big C)",
    brand: "Big C",
    address: "Khu Dân Cư Hưng Phú 1, Cái Răng, Cần Thơ",
    openHours: "08:00 - 22:00",
    phone: "0292 3737 888",
    logo: "https://res.cloudinary.com/dt9x7z8qw/image/upload/v1/smartcook/brands/bigc.png",
    location: {
      type: "Point",
      coordinates: [105.7891, 10.0173],
    },
  },
];
