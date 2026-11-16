<?php

namespace Tests\Feature;

use App\Models\Journey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JourneyModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_publishing_journey_waits_for_moderation_before_showing_publicly(): void
    {
        $author = User::factory()->student()->create();

        $response = $this->actingAs($author)
            ->post(route('journeys.store'), [
                'title' => 'Perjalanan Belajarku',
                'content' => 'Cerita lengkap perjalanan belajar saya.',
                'status' => 'published',
            ]);

        $response->assertRedirect(route('journeys.mine'));
        $response->assertSessionHas(
            'success',
            'Sharing Journey berhasil dikirim dan menunggu moderasi admin.'
        );

        $this->assertDatabaseHas('journeys', [
            'author_id' => $author->id,
            'status' => Journey::STATUS_MENUNGGU,
        ]);

        $this->actingAs($author)
            ->get(route('journeys.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Index')
                ->has('journeys.data', 0)
            );

        $this->actingAs($author)
            ->get('/journeys/perjalanan-belajarku')
            ->assertNotFound();

        $this->actingAs($author)
            ->get(route('journeys.mine'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Mine')
                ->has('journeys.data', 1)
                ->where('journeys.data.0.status', Journey::STATUS_MENUNGGU)
            );
    }

    public function test_draft_journey_is_not_public_and_appears_in_my_stories(): void
    {
        $author = User::factory()->student()->create();

        $this->actingAs($author)
            ->post(route('journeys.store'), [
                'title' => 'Draft Cerita',
                'content' => 'Masih berupa draft.',
                'status' => 'draft',
            ])
            ->assertRedirect(route('journeys.mine'));

        $this->assertDatabaseHas('journeys', [
            'author_id' => $author->id,
            'status' => Journey::STATUS_DRAFT,
        ]);

        $this->actingAs($author)
            ->get(route('journeys.index'))
            ->assertInertia(fn (Assert $page) => $page->has('journeys.data', 0));

        $this->actingAs($author)
            ->get(route('journeys.mine'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('journeys.data', 1)
                ->where('journeys.data.0.status', Journey::STATUS_DRAFT)
            );
    }

    public function test_admin_can_approve_journey_and_make_it_public(): void
    {
        $admin = User::factory()->admin()->create();
        $author = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_MENUNGGU);

        $this->actingAs($admin)
            ->get(route('admin.journeys.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Journey/Index')
                ->where('currentStatus', 'menunggu')
                ->has('journeys.data', 1)
                ->where('journeys.data.0.id', $journey->id)
            );

        $this->actingAs($admin)
            ->from(route('admin.journeys.index'))
            ->patch(route('admin.journeys.approve', $journey->id))
            ->assertRedirect(route('admin.journeys.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'status' => Journey::STATUS_PUBLISHED,
            'moderation_note' => null,
        ]);

        $this->get(route('journeys.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Index')
                ->has('journeys.data', 1)
                ->where('journeys.data.0.id', $journey->id)
            );

        $this->get(route('journeys.show', $journey->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Show')
                ->where('journey.id', $journey->id)
            );
    }

    public function test_admin_can_reject_journey_and_author_sees_the_status(): void
    {
        $admin = User::factory()->admin()->create();
        $author = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_MENUNGGU);

        $this->actingAs($admin)
            ->from(route('admin.journeys.index'))
            ->patch(route('admin.journeys.reject', $journey->id), [
                'moderation_note' => 'Cerita mengandung promosi berbayar.',
            ])
            ->assertRedirect(route('admin.journeys.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'status' => Journey::STATUS_DITOLAK,
            'moderation_note' => 'Cerita mengandung promosi berbayar.',
        ]);

        $this->get(route('journeys.show', $journey->slug))->assertNotFound();

        $this->actingAs($author)
            ->get(route('journeys.mine'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('journeys.data', 1)
                ->where('journeys.data.0.status', Journey::STATUS_DITOLAK)
                ->where(
                    'journeys.data.0.moderation_note',
                    'Cerita mengandung promosi berbayar.'
                )
            );
    }

    public function test_editing_published_journey_returns_it_to_moderation(): void
    {
        $author = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED);

        $this->actingAs($author)
            ->put(route('journeys.update', $journey->slug), [
                'title' => 'Judul Baru Perjalanan',
                'content' => 'Isi cerita yang sudah diperbarui.',
                'status' => 'published',
            ])
            ->assertRedirect(route('journeys.mine'))
            ->assertSessionHas(
                'success',
                'Perubahan Sharing Journey berhasil disimpan dan menunggu moderasi admin.'
            );

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'title' => 'Judul Baru Perjalanan',
            'status' => Journey::STATUS_MENUNGGU,
        ]);

        $this->get('/journeys/judul-baru-perjalanan')->assertNotFound();
    }

    public function test_rejected_journey_can_be_resubmitted_for_moderation(): void
    {
        $author = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_DITOLAK, [
            'moderation_note' => 'Perbaiki ejaan terlebih dahulu.',
        ]);

        $this->actingAs($author)
            ->put(route('journeys.update', $journey->slug), [
                'title' => $journey->title,
                'content' => 'Isi cerita yang sudah diperbaiki.',
                'status' => 'published',
            ])
            ->assertRedirect(route('journeys.mine'));

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'status' => Journey::STATUS_MENUNGGU,
            'moderation_note' => null,
        ]);
    }

    public function test_only_owner_or_admin_can_edit_and_delete_journey(): void
    {
        $owner = User::factory()->student()->create();
        $otherUser = User::factory()->student()->create();
        $admin = User::factory()->admin()->create();

        $journey = $this->createJourney($owner, Journey::STATUS_PUBLISHED);

        $this->actingAs($owner)
            ->get(route('journeys.edit', $journey->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Edit')
                ->where('journey.id', $journey->id)
                ->where('isAdmin', false)
            );

        $this->actingAs($otherUser)
            ->get(route('journeys.edit', $journey->slug))
            ->assertForbidden();

        $this->actingAs($otherUser)
            ->put(route('journeys.update', $journey->slug), [
                'title' => 'Percobaan Edit',
                'content' => 'Tidak boleh berhasil.',
                'status' => 'published',
            ])
            ->assertForbidden();

        $this->actingAs($otherUser)
            ->delete(route('journeys.destroy', $journey->slug))
            ->assertForbidden();

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'title' => $journey->title,
        ]);

        $this->actingAs($admin)
            ->get(route('journeys.edit', $journey->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Journeys/Edit')
                ->where('isAdmin', true)
            );

        $this->actingAs($admin)
            ->put(route('journeys.update', $journey->slug), [
                'title' => 'Judul Diperbarui Admin',
                'content' => 'Konten yang disunting admin.',
                'status' => 'published',
            ])
            ->assertRedirect(route('admin.journeys.index'));

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'title' => 'Judul Diperbarui Admin',
            'status' => Journey::STATUS_PUBLISHED,
        ]);

        $this->actingAs($admin)
            ->delete('/journeys/judul-diperbarui-admin')
            ->assertRedirect(route('admin.journeys.index'));

        $this->assertDatabaseMissing('journeys', ['id' => $journey->id]);
    }

    public function test_non_admin_cannot_moderate_journeys(): void
    {
        $author = User::factory()->student()->create();
        $journey = $this->createJourney($author, Journey::STATUS_MENUNGGU);

        $this->actingAs($author)
            ->get(route('admin.journeys.index'))
            ->assertNotFound();

        $this->actingAs($author)
            ->patch(route('admin.journeys.approve', $journey->id))
            ->assertNotFound();

        $this->assertDatabaseHas('journeys', [
            'id' => $journey->id,
            'status' => Journey::STATUS_MENUNGGU,
        ]);
    }

    public function test_script_content_is_not_rendered_raw_into_the_page(): void
    {
        $author = User::factory()->student()->create();

        $journey = $this->createJourney($author, Journey::STATUS_PUBLISHED, [
            'content' => 'Halo <script>alert("xss")</script> dunia.',
        ]);

        $response = $this->get(route('journeys.show', $journey->slug));

        $response->assertOk();
        $response->assertDontSee('<script>alert("xss")</script>', false);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Journeys/Show')
            ->where('journey.content', 'Halo <script>alert("xss")</script> dunia.')
        );
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
