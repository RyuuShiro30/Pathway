<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Forum;
use App\Models\Course;
use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Auth;

class ForumController extends Controller
{
    public function store(Request $request, Course $course)
    {
        // 1. Validasi inputan dari user
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string', // Menyesuaikan nama kolom di tabel
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', // Maksimal 2MB
        ]);

        $imageUrl = null;

        // 2. Cek dan proses upload ke Cloudinary jika ada gambar
        if ($request->hasFile('image')) {
            $cloudinary = new Cloudinary();

            $upload = $cloudinary->uploadApi()->upload(
                $request->file('image')->getRealPath(),
                ['folder' => 'pathway_forums'] // Otomatis bikin folder baru di awan
            );

            $imageUrl = $upload['secure_url'];
        }

        // 3. Simpan data diskusi ke PostgreSQL
        Forum::create([
            'course_id' => $course->id,
            'author_id' => Auth::id(), // ID user yang sedang login
            'title'     => $request->title,
            'body'      => $request->body,
            'image_url' => $imageUrl,
        ]);

        // 4. Reload halaman untuk Inertia.js
        return redirect()->back()->with('success', 'Diskusi baru berhasil dibuat!');
    }
}