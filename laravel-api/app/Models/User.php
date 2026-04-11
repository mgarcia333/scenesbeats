<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'spotify_id',
        'google_id',
        'avatar',
        'letterboxd_username',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function sentFriendRequests()
    {
        return $this->hasMany(Friendship::class, 'sender_id');
    }

    public function receivedFriendRequests()
    {
        return $this->hasMany(Friendship::class, 'recipient_id');
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function lists()
    {
        return $this->hasMany(MediaList::class);
    }

    /**
     * Get accepted friends
     */
    public function friends()
    {
        $sent = $this->sentFriendRequests()->where('status', 'accepted')->pluck('recipient_id');
        $received = $this->receivedFriendRequests()->where('status', 'accepted')->pluck('sender_id');
        
        return User::whereIn('id', $sent->merge($received))->get();
    }
}
