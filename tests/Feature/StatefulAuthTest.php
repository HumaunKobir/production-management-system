<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatefulAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_accepts_session_from_lan_style_origin(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders([
            'Origin' => 'http://192.168.1.50:8000',
            'Referer' => 'http://192.168.1.50:8000/admin',
        ])
            ->actingAs($user)
            ->getJson('/api/me');

        $response->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_and_me_work_with_stateful_session(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);

        $this->withHeaders([
            'Origin' => 'http://127.0.0.1:8000',
            'Referer' => 'http://127.0.0.1:8000/login',
        ])->get('/sanctum/csrf-cookie');

        $login = $this->withHeaders([
            'Origin' => 'http://127.0.0.1:8000',
            'Referer' => 'http://127.0.0.1:8000/login',
        ])->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $login->assertOk();

        $this->withHeaders([
            'Origin' => 'http://127.0.0.1:8000',
            'Referer' => 'http://127.0.0.1:8000/admin',
        ])->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }
}
