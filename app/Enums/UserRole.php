<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Operator = 'operator';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Manager => 'Manager',
            self::Operator => 'Operator',
        };
    }

    public function canManageUsers(): bool
    {
        return $this === self::Admin;
    }

    public function canManageProducts(): bool
    {
        return in_array($this, [self::Admin, self::Manager], true);
    }

    public function canExecuteProduction(): bool
    {
        return true;
    }
}
