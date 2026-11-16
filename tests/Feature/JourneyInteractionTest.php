<?php

namespace Tests\Feature;

use App\Models\Journey;
use App\Models\JourneyBookmark;
use App\Models\JourneyComment;
use App\Models\JourneyLike;
use App\Models\JourneyReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JourneyInteractionTest extends TestCase
{
    use RefreshDatabase;

    public function test_like_toggle_updates_counter_and_reflects_on_show_page(): void
    {
        $author = User::factory()->student()->create();
        $reader = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);
        $showUrl = route('journeys.show', $journey->slug);

        $this->actingAs($reader)
            ->from($showUrl)
            ->post(route('journeys.like', $journey->slug))
            ->assertRedirect($showUrl);

        $this->assertDatabaseHas('journey_likes', [
            'journey_id' => $journey->id,
            'user_id' => $reader->id,
        ]);

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'likes_count' => 1,
        ]);

        $this->actingAs($reader)
            ->get($showUrl)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Show')
                ->where('interactions.is_liked', true)
                ->where('interactions.likes_count', 1)
                ->where('interactions.can_manage', false)
            );

        $this->actingAs($reader)
            ->from($showUrl)
            ->post(route('journeys.like', $journey->slug))
            ->assertRedirect($showUrl);

        $this->assertDatabaseMissing('journey_likes', [
            'journey_id' => $journey->id,
            'user_id' => $reader->id,
        ]);

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'likes_count' => 0,
        ]);
    }

    public function test_guest_cannot_interact_with_journey(): void
    {
        $author = User::factory()->student()->create();
        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);

        $this->post(route('journeys.like', $journey->slug))
            ->assertRedirect(route('login'));

        $this->post(route('journeys.bookmark', $journey->slug))
            ->assertRedirect(route('login'));

        $this->post(route('journeys.comments.store', $journey->slug), [
            'body' => 'Komentar tamu.',
        ])->assertRedirect(route('login'));

        $this->assertDatabaseCount('journey_likes', 0);
        $this->assertDatabaseCount('journey_bookmarks', 0);
        $this->assertDatabaseCount('journey_comments', 0);
    }

    public function test_bookmark_toggle_and_saved_page_only_lists_published_journeys(): void
    {
        $author = User::factory()->student()->create();
        $reader = User::factory()->student()->create();

        $published = $this->createJourney($author, Journey::STATUS_PUBLISHED);
        $hidden = $this->createJourney($author, Journey::STATUS_MENUNGGU);

        JourneyBookmark::query()->create([
            'journey_id' => $hidden->id,
            'user_id' => $reader->id,
        ]);

        $showUrl = route('journeys.show', $published->slug);

        $this->actingAs($reader)
            ->from($showUrl)
            ->post(route('journeys.bookmark', $published->slug))
            ->assertRedirect($showUrl)
            ->assertSessionHas('success', 'Cerita disimpan ke daftar tersimpan.');

        $this->actingAs($reader)
            ->get(route('journeys.saved'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Saved')
                ->has('journeys.data', 1)
                ->where('journeys.data.0.id', $published->id)
            );

        $this->actingAs($reader)
            ->get($showUrl)
            ->assertInertia(fn (Assert $page) => $page
                ->where('interactions.is_bookmarked', true)
            );

        $this->actingAs($reader)
            ->from($showUrl)
            ->post(route('journeys.bookmark', $published->slug))
            ->assertSessionHas(
                'success',
                'Cerita dihapus dari daftar tersimpan.'
            );

        $this->assertDatabaseMissing('journey_bookmarks', [
            'journey_id' => $published->id,
            'user_id' => $reader->id,
        ]);

        $this->actingAs($reader)
            ->get(route('journeys.saved'))
            ->assertInertia(fn (Assert $page) => $page->has('journeys.data', 0));
    }

    public function test_comment_can_be_posted_and_permissions_are_reflected(): void
    {
        $author = User::factory()->student()->create();
        $reader = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);
        $showUrl = route('journeys.show', $journey->slug);

        $this->actingAs($reader)
            ->from($showUrl)
            ->post(route('journeys.comments.store', $journey->slug), [
                'body' => 'Cerita yang sangat menginspirasi!',
            ])
            ->assertRedirect($showUrl)
            ->assertSessionHas('success', 'Komentar berhasil ditambahkan.');

        $this->assertDatabaseHas('journey_comments', [
            'journey_id' => $journey->id,
            'user_id' => $reader->id,
            'body' => 'Cerita yang sangat menginspirasi!',
        ]);

        $this->actingAs($reader)
            ->get($showUrl)
            ->assertInertia(fn (Assert $page) => $page
                ->has('comments', 1)
                ->where('comments.0.body', 'Cerita yang sangat menginspirasi!')
                ->where('comments.0.user.id', $reader->id)
                ->where('comments.0.can_delete', true)
                ->where('interactions.comments_count', 1)
                ->where('interactions.can_toggle_comments', false)
            );

        $this->actingAs($author)
            ->get($showUrl)
            ->assertInertia(fn (Assert $page) => $page
                ->where('comments.0.can_delete', true)
                ->where('interactions.can_manage', true)
                ->where('interactions.can_toggle_comments', true)
            );

        $this->actingAs($reader)
            ->post(route('journeys.comments.store', $journey->slug), [
                'body' => '',
            ])
            ->assertSessionHasErrors('body');
    }

    public function test_author_can_disable_comments_and_others_cannot_post(): void
    {
        $author = User::factory()->student()->create();
        $reader = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);
        $showUrl = route('journeys.show', $journey->slug);

        $this->actingAs($author)
            ->from($showUrl)
            ->patch(route('journeys.comments.setting', $journey->slug))
            ->assertRedirect($showUrl)
            ->assertSessionHas('success', 'Kolom komentar dinonaktifkan.');

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'allow_comments' => false,
        ]);

        $this->actingAs($reader)
            ->post(route('journeys.comments.store', $journey->slug), [
                'body' => 'Komentar saat komentar ditutup.',
            ])
            ->assertForbidden();

        $this->assertDatabaseCount('journey_comments', 0);

        $this->actingAs($reader)
            ->from($showUrl)
            ->patch(route('journeys.comments.setting', $journey->slug))
            ->assertForbidden();

        $this->actingAs($author)
            ->from($showUrl)
            ->patch(route('journeys.comments.setting', $journey->slug))
            ->assertSessionHas('success', 'Kolom komentar diaktifkan.');

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'allow_comments' => true,
        ]);
    }

    public function test_comment_can_be_deleted_by_commenter_journey_author_or_admin(): void
    {
        $author = User::factory()->student()->create();
        $commenter = User::factory()->student()->create();
        $otherUser = User::factory()->student()->create();
        $admin = User::factory()->admin()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);

        $comment = JourneyComment::query()->create([
            'journey_id' => $journey->id,
            'user_id' => $commenter->id,
            'body' => 'Komentar untuk diuji.',
        ]);

        $this->actingAs($otherUser)
            ->delete(route('journeys.comments.destroy', [
                $journey->slug,
                $comment->id,
            ]))
            ->assertForbidden();

        $this->assertDatabaseHas('journey_comments', ['id' => $comment->id]);

        $this->actingAs($author)
            ->delete(route('journeys.comments.destroy', [
                $journey->slug,
                $comment->id,
            ]))
            ->assertSessionHas('success', 'Komentar berhasil dihapus.');

        $this->assertDatabaseMissing('journey_comments', ['id' => $comment->id]);

        $second = JourneyComment::query()->create([
            'journey_id' => $journey->id,
            'user_id' => $commenter->id,
            'body' => 'Komentar kedua.',
        ]);

        $this->actingAs($commenter)
            ->delete(route('journeys.comments.destroy', [
                $journey->slug,
                $second->id,
            ]))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('journey_comments', ['id' => $second->id]);

        $third = JourneyComment::query()->create([
            'journey_id' => $journey->id,
            'user_id' => $commenter->id,
            'body' => 'Komentar ketiga.',
        ]);

        $this->actingAs($admin)
            ->delete(route('journeys.comments.destroy', [
                $journey->slug,
                $third->id,
            ]))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('journey_comments', ['id' => $third->id]);
    }

    public function test_report_flow_from_submission_to_admin_resolution(): void
    {
        $author = User::factory()->student()->create();
        $reporter = User::factory()->student()->create();
        $admin = User::factory()->admin()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);
        $showUrl = route('journeys.show', $journey->slug);

        $this->actingAs($reporter)
            ->from($showUrl)
            ->post(route('journeys.reports.store', $journey->slug), [
                'reason' => 'Konten mengandung ujaran kebencian.',
            ])
            ->assertRedirect($showUrl)
            ->assertSessionHas('success');

        $this->assertDatabaseHas('journey_reports', [
            'journey_id' => $journey->id,
            'reporter_id' => $reporter->id,
            'status' => JourneyReport::STATUS_MENUNGGU,
        ]);

        $this->actingAs($reporter)
            ->from($showUrl)
            ->post(route('journeys.reports.store', $journey->slug), [
                'reason' => 'Laporan ganda.',
            ])
            ->assertSessionHas(
                'error',
                'Kamu sudah melaporkan cerita ini.'
            );

        $this->assertDatabaseCount('journey_reports', 1);

        $this->actingAs($author)
            ->from($showUrl)
            ->post(route('journeys.reports.store', $journey->slug), [
                'reason' => 'Melaporkan diri sendiri.',
            ])
            ->assertSessionHas(
                'error',
                'Kamu tidak dapat melaporkan ceritamu sendiri.'
            );

        $this->assertDatabaseCount('journey_reports', 1);

        $this->actingAs($admin)
            ->get(route('admin.journey-reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/JourneyReport/Index')
                ->where('currentStatus', 'menunggu')
                ->where('counts.menunggu', 1)
                ->has('reports.data', 1)
                ->where('reports.data.0.journey_id', $journey->id)
                ->where('reports.data.0.reporter_id', $reporter->id)
            );

        $report = JourneyReport::query()->firstOrFail();

        $this->actingAs($admin)
            ->from(route('admin.journey-reports.index'))
            ->patch(route('admin.journey-reports.resolve', $report->id))
            ->assertRedirect(route('admin.journey-reports.index'))
            ->assertSessionHas('success', 'Laporan journey ditandai selesai.');

        $this->assertDatabaseHas('journey_reports', [
            'id' => $report->id,
            'status' => JourneyReport::STATUS_SELESAI,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.journey-reports.index', ['status' => 'selesai']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentStatus', 'selesai')
                ->has('reports.data', 1)
            );
    }

    public function test_non_admin_cannot_access_report_queue(): void
    {
        $user = User::factory()->student()->create();

        $this->actingAs($user)
            ->get(route('admin.journey-reports.index'))
            ->assertNotFound();
    }

    public function test_interactions_are_blocked_for_unpublished_journeys(): void
    {
        $author = User::factory()->student()->create();
        $reader = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_MENUNGGU);

        $this->actingAs($reader)
            ->post(route('journeys.like', $journey->slug))
            ->assertNotFound();

        $this->actingAs($reader)
            ->post(route('journeys.bookmark', $journey->slug))
            ->assertNotFound();

        $this->actingAs($reader)
            ->post(route('journeys.comments.store', $journey->slug), [
                'body' => 'Tidak boleh tercatat.',
            ])
            ->assertNotFound();

        $this->actingAs($reader)
            ->post(route('journeys.reports.store', $journey->slug), [
                'reason' => 'Tidak boleh tercatat.',
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('journey_likes', 0);
        $this->assertDatabaseCount('journey_bookmarks', 0);
        $this->assertDatabaseCount('journey_comments', 0);
        $this->assertDatabaseCount('journey_reports', 0);
    }

    public function test_like_counter_never_drops_below_zero(): void
    {
        $author = User::factory()->student()->create();
        $reader = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED, [
            'likes_count' => 0,
        ]);

        JourneyLike::query()->create([
            'journey_id' => $journey->id,
            'user_id' => $reader->id,
        ]);

        $journey->update(['likes_count' => 0]);

        $this->actingAs($reader)
            ->post(route('journeys.like', $journey->slug));

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'likes_count' => 0,
        ]);
    }

    private function createJourney(
        User $author,
        string $status,
        array $overrides = []
    ): Journey {
        return Journey::query()->create(array_merge([
            'author_id' => $author->id,
            'title' => 'Perjalanan '.fake()->unique()->word(),
            'slug' => 'perjalanan-'.fake()->unique()->slug(2),
            'content' => 'Cerita perjalanan belajar.',
            'status' => $status,
        ], $overrides));
    }
}
