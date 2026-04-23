# NestJS Scalable Domain-Driven Design

## 1. Filosofi Arsitektur

Arsitektur ini mengadopsi prinsip **Clean Architecture** dan **Modular Design**. Tujuannya adalah memisahkan antara logika bisnis, infrastruktur, dan transportasi data agar kode tetap mudah diuji (_testable_) dan dikembangkan oleh tim.

### Prinsip Utama:

- **Separation of Concerns (SoC):** Setiap bagian kode hanya bertanggung jawab atas satu hal.
- **Single Responsibility Principle (SRP):** Satu modul atau kelas hanya memiliki satu alasan untuk berubah.
- **Predictability:** Penempatan file yang konsisten membuat navigasi kode menjadi intuitif.

---

## 2. Struktur Folder (Project Skeleton)

```text
src/
├── core/                   # Singleton & Global logic
│   ├── filters/            # Global Exception Filters (Error handling terpusat)
│   ├── interceptors/       # Response Mapping (Format response seragam)
│   ├── guards/             # JWT & Role-based Access Control
│   └── middleware/         # Logger, Compression, dsb.
├── common/                 # Reusable helpers
│   ├── decorators/         # Custom decorators (e.g., @CurrentUser)
│   ├── constants/          # Enum, String constants
│   └── dto/                # Global DTOs (e.g., PaginationQueryDto)
├── config/                 # Configuration management (Env validation)
├── modules/                # Domain-Driven Modules (Logika Bisnis Utama)
│   ├── [feature-name]/     # Contoh: auth, users, transactions
│   │   ├── controllers/    # Entry point (HTTP/Microservice)
│   │   ├── services/       # Business Logic Layer
│   │   ├── repository/     # Data Access Layer (Optional, jika ingin abstraksi DB)
│   │   ├── dto/            # Input validation schemas
│   │   ├── entities/       # Database schemas (TypeORM/Prisma)
│   │   ├── interfaces/     # TypeScript Types & Interfaces
│   │   └── [feature].module.ts
├── main.ts                 # Bootstrap aplikasi
└── app.module.ts           # Root module
```

---

## 3. Aturan Layer & Aliran Data

### A. Controller Layer

**Tugas:** Validasi input dan mengarahkan ke service yang tepat.

- **Alasan:** Controller tidak boleh berisi logika bisnis (misal: perhitungan diskon atau pengecekan db langsung). Ini membuat API mudah diganti dari REST ke GraphQL atau Microservice tanpa menyentuh logika utama.
- **Standar:** Selalu gunakan DTO untuk `@Body()`, `@Query()`, dan `@Param()`.

### B. Service Layer (Provider)

**Tugas:** Menjalankan logika bisnis dan orkestrasi data.

- **Alasan:** Menjadi pusat kebenaran logika aplikasi. Jika ada perubahan aturan bisnis, hanya layer ini yang berubah.
- **Standar:** Gunakan _Dependency Injection_ untuk mengakses repository atau service lain.

### C. Data Access Layer (Entity/Repository)

**Tugas:** Berinteraksi dengan database.

- **Alasan:** Mengisolasi query database. Jika Anda ingin pindah dari PostgreSQL ke MongoDB, Anda hanya perlu menyesuaikan layer ini.

---

## 4. Standar Implementasi Teknis

### 1. Global Response & Error Handling

Gunakan **Interceptors** agar setiap response sukses selalu memiliki format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Gunakan **Exception Filters** agar error tidak membocorkan _stack trace_ di produksi dan memiliki format konsisten.

### 2. Validasi Data (DTO)

Gunakan `class-validator` secara ketat di `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Hapus properti yang tidak ada di DTO
    forbidNonWhitelisted: true, // Error jika ada properti tambahan
    transform: true, // Otomatis ubah tipe data (misal string ke number)
  }),
);
```

### 3. Konfigurasi Terpusat

Gunakan `@nestjs/config` dengan validasi schema (Joi atau Zod).

- **Alasan:** Mencegah aplikasi menyala jika variabel environment (DB_URL, JWT_SECRET) tidak lengkap.

### 4. Dokumentasi API (Swagger)

Integrasikan Swagger di setiap modul menggunakan dekorator `@ApiTags`, `@ApiOperation`, dan `@ApiResponse`.

- **Alasan:** Menghilangkan hambatan komunikasi dengan frontend karena dokumentasi selalu _up-to-date_ dengan kode.

---

## 5. Strategi Scalability

- **Modularitas:** Pastikan antar modul di dalam folder `modules/` hanya berkomunikasi lewat service yang diekspor. Jangan ada _circular dependency_.
- **Database:** Gunakan migrasi (Prisma/TypeORM), jangan gunakan `synchronize: true` di produksi.
- **Logging:** Gunakan Winston atau Pino untuk logging yang terstruktur (JSON) agar mudah dibaca oleh ELK Stack atau Datadog.
