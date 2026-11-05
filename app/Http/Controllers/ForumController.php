<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Forum;
use App\Models\Course;
use App\Models\ForumReply;
use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ForumController extends Controller
{
    // 1. Menampilkan daftar semua diskusi di course ini
    public function index(Course $course)
    {
        // Tambahkan withCount('replies')
        $forums = Forum::with('author')
            ->withCount('replies')
            ->where('course_id', $course->id)
            ->latest()
            ->get();

        return Inertia::render('Forums/Index', [
            'course' => $course,
            'forums' => $forums
        ]);
    }

    // 2. Menampilkan halaman form buat diskusi baru
    public function create(Course $course)
    {
        return Inertia::render('Forums/Create', [
            'course' => $course
        ]);
    }

    // 3. Memproses penyimpanan data dan gambar ke database & awan
    public function store(Request $request, Course $course)
    {
        // 1. Validasi inputan dari user
        $request->validate([
            'title' => 'required|string|max:255',
            'body'  => 'required|string', 
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', 
        ]);

        $imageUrl = null;

        // 2. Cek dan proses upload ke Cloudinary jika ada gambar
        if ($request->hasFile('image')) {
            $cloudinary = new Cloudinary();

            $upload = $cloudinary->uploadApi()->upload(
                $request->file('image')->getRealPath(),
                ['folder' => 'pathway_forums'] 
            );

            $imageUrl = $upload['secure_url'];
        }

        // 3. Simpan data diskusi ke PostgreSQL
        Forum::create([
            'course_id' => $course->id,
            'author_id' => Auth::id(), 
            'title'     => $request->title,
            'body'      => $request->body,
            'image_url' => $imageUrl,
        ]);

        // 4. Kembali ke halaman list forum
        return redirect()->route('forums.index', $course->slug)->with('success', 'Diskusi baru berhasil dibuat!');
    }
    public function show(Course $course, Forum $forum)
    {
        // Tarik data pembuat diskusi, beserta semua balasan & siapa yang membalas
        $forum->load(['author', 'replies.user']);

        return Inertia::render('Forums/Show', [
            'course' => $course,
            'forum'  => $forum
        ]);
    }

    // 5. Menyimpan balasan/komentar baru
    public function storeReply(Request $request, Course $course, Forum $forum)
    {
        $request->validate([
            'body' => 'required|string',
        ]);

        ForumReply::create([
            'forum_id' => $forum->id,
            'user_id'  => Auth::id(),
            'body'     => $request->body,
        ]);

        return back();
    }
}