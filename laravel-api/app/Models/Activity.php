<?php

namespace App\Models;

use App\Helpers\NodeBroadcaster;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'type', 'subject_id', 'subject_type', 'data'];

    protected $casts = [
        'data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Automatic broadcast after creation
     */
    protected static function booted()
    {
        static::created(function ($activity) {
            NodeBroadcaster::broadcast('new_activity', $activity->load('user')->toArray());
        });
    }
}
