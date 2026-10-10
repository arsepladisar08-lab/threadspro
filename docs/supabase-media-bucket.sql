-- Bucket publik untuk lampiran gambar/video AutoThreads.
-- Jalankan di Supabase Dashboard > SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'autothreads-media',
  'autothreads-media',
  true,
  null, -- batas ukuran mengikuti batas global proyek (paket gratis: sekitar 50 MB per file)
  array['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      allowed_mime_types = excluded.allowed_mime_types;

-- Izinkan unggah dengan anon key ke bucket ini saja.
-- Catatan keamanan: siapa pun yang punya anon key bisa mengunggah ke bucket ini.
create policy "autothreads media upload"
on storage.objects for insert to anon
with check (bucket_id = 'autothreads-media');
