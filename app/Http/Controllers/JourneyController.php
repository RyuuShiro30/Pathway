<?php

namespace App\Http\Controllers;

use App\Models\Journey;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class JourneyController extends Controller
{
    public function index()
    {
        $journeys = Journey::query()
            ->with('author:id,name')
            ->published()
            ->latest()
            ->paginate(9);

        return Inertia::render('Journeys/Index', [
            'journeys' => $journeys,
        ]);
    }

    public function mine()
    {
        $journeys = Journey::query()
            ->where('author_id', auth()->id())
            ->latest()
            ->paginate(10);

        return Inertia::render('Journeys/Mine', [
            'journeys' => $journeys,
        ]);
    }

    public function show(Request $request, Journey $journey)
    {
        abort_unless($journey->status === Journey::STATUS_PUBLISHED, 404);

        $journey->load([
            'author:id,name',
            'comments' => fn ($query) => $query
                ->with('user:id,name')
                ->latest(),
        ]);

        $user = $request->user();
        $isOwner = $user && $journey->author_id === $user->id;
        $isAdmin = $user?->role === 'admin';
        $canManage = $isOwner || $isAdmin;

        return Inertia::render('Journeys/Show', [
            'journey' => $journey->only([
                'id',
                'title',
                'slug',
                'content',
                'likes_count',
                'allow_comments',
            ]) + [
                'author' => $journey->author,
                'created_at' => $journey->created_at?->copy()
                    ->setTimezone('UTC')
                    ->toISOString(),
            ],
            'comments' => $journey->comments
                ->map(fn ($comment) => [
                    'id' => $comment->id,
                    'body' => $comment->body,
                    'created_at' => $comment->created_at?->copy()
                        ->setTimezone('UTC')
                        ->toISOString(),
                    'user' => $comment->user?->only(['id', 'name']),
                    'can_delete' => $user && (
                        $comment->user_id === $user->id
                        || $canManage
                    ),
                ])
                ->values(),
            'interactions' => [
                'likes_count' => $journey->likes_count,
                'comments_count' => $journey->comments->count(),
                'is_liked' => $user
                    ? $journey->likes()->where('user_id', $user->id)->exists()
                    : false,
                'is_bookmarked' => $user
                    ? $journey->bookmarks()->where('user_id', $user->id)->exists()
                    : false,
                'can_manage' => $canManage,
                'can_toggle_comments' => $canManage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Journeys/Create');
    }

    public function store(Request $request)
    {
        $validated = $this->validateJourney($request);

        $status = $validated['status'] === 'draft'
            ? Journey::STATUS_DRAFT
            : Journey::STATUS_MENUNGGU;

        Journey::create([
            'author_id' => $request->user()->id,
            'title' => $validated['title'],
            'slug' => $this->uniqueSlug($validated['title']),
            'content' => $validated['content'],
            'status' => $status,
            'allow_comments' => $validated['allow_comments'] ?? true,
        ]);

        return redirect()
            ->route('journeys.mine')
            ->with('success', $status === Journey::STATUS_DRAFT
                ? 'Draft Sharing Journey berhasil disimpan.'
                : 'Sharing Journey berhasil dikirim dan menunggu moderasi admin.');
    }

    public function edit(Request $request, Journey $journey)
    {
        $this->authorizeManage($request, $journey);

        return Inertia::render('Journeys/Edit', [
            'journey' => $journey,
            'isAdmin' => $request->user()->role === 'admin',
        ]);
    }

    public function update(Request $request, Journey $journey)
    {
        $this->authorizeManage($request, $journey);

        $validated = $this->validateJourney($request);

        $isAdmin = $request->user()->role === 'admin';

        $status = match (true) {
            $validated['status'] === 'draft' => Journey::STATUS_DRAFT,
            $isAdmin => Journey::STATUS_PUBLISHED,
            default => Journey::STATUS_MENUNGGU,
        };

        $journey->update([
            'title' => $validated['title'],
            'slug' => $this->uniqueSlug($validated['title'], $journey->id),
            'content' => $validated['content'],
            'status' => $status,
            'moderation_note' => null,
            'allow_comments' => $validated['allow_comments'] ?? $journey->allow_comments,
        ]);

        return redirect()
            ->route($isAdmin ? 'admin.journeys.index' : 'journeys.mine')
            ->with('success', $isAdmin
                ? 'Sharing Journey berhasil diperbarui.'
                : 'Perubahan Sharing Journey berhasil disimpan dan menunggu moderasi admin.');
    }

    public function destroy(Request $request, Journey $journey)
    {
        $this->authorizeManage($request, $journey);

        $journey->delete();

        return redirect()
            ->route(
                $request->user()->role === 'admin'
                    ? 'admin.journeys.index'
                    : 'journeys.mine'
            )
            ->with('success', 'Sharing Journey berhasil dihapus.');
    }

    private function validateJourney(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:draft,published'],
            'allow_comments' => ['sometimes', 'boolean'],
        ], [
            'title.required' => 'Judul cerita wajib diisi.',
            'title.max' => 'Judul cerita maksimal 255 karakter.',
            'content.required' => 'Isi cerita wajib diisi.',
            'status.in' => 'Status cerita tidak valid.',
        ]);
    }

    private function authorizeManage(Request $request, Journey $journey): void
    {
        abort_unless(
            $journey->author_id === $request->user()->id
                || $request->user()->role === 'admin',
            403
        );
    }

    private function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        while (
            Journey::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $originalSlug.'-'.$counter++;
        }

        return $slug;
    }
}
