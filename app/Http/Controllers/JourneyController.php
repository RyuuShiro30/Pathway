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
        $journeys = Journey::with('author:id,name')
            ->where('status', 'published')
            ->latest()
            ->paginate(9);

        return Inertia::render('Journeys/Index', [
            'journeys' => $journeys,
        ]);
    }

    public function show(Journey $journey)
    {
        abort_unless($journey->status === 'published', 404);

        $journey->load('author:id,name');

        return Inertia::render('Journeys/Show', [
            'journey' => $journey,
        ]);
    }

    public function create()
    {
        return Inertia::render('Journeys/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:draft,published'],
        ]);

        $slug = Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;

        while (Journey::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        Journey::create([
            'author_id' => $request->user()->id,
            'title' => $validated['title'],
            'slug' => $slug,
            'content' => $validated['content'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('journeys.index')
            ->with('success', 'Sharing Journey berhasil dibuat.');
    }

    public function edit(Journey $journey)
    {
        abort_unless(
            $journey->author_id === auth()->id(),
            403
        );

        return Inertia::render('Journeys/Edit', [
            'journey' => $journey,
        ]);
    }

    public function update(Request $request, Journey $journey)
    {
        abort_unless(
            $journey->author_id === $request->user()->id,
            403
        );

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'status' => ['required', 'in:draft,published'],
        ]);

        $slug = Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;

        while (
            Journey::where('slug', $slug)
                ->where('id', '!=', $journey->id)
                ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter++;
        }

        $journey->update([
            'title' => $validated['title'],
            'slug' => $slug,
            'content' => $validated['content'],
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('journeys.index')
            ->with('success', 'Sharing Journey berhasil diperbarui.');
    }

    public function destroy(Request $request, Journey $journey)
    {
        abort_unless(
            $journey->author_id === $request->user()->id,
            403
        );

        $journey->delete();

        return redirect()
            ->route('journeys.index')
            ->with('success', 'Sharing Journey berhasil dihapus.');
    }
}
