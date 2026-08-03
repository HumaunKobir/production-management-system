<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Extends Sanctum stateful domains for the current request host.
 * Fixes session auth when using a LAN IP, a different port, or localhost vs 127.0.0.1.
 */
class ConfigureStatefulAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment('local', 'testing')) {
            return $next($request);
        }

        $stateful = array_filter(array_map('trim', config('sanctum.stateful', [])));

        foreach ($this->extractHosts($request) as $host) {
            if ($host !== '' && ! in_array($host, $stateful, true)) {
                $stateful[] = $host;
            }
        }

        config(['sanctum.stateful' => array_values(array_unique($stateful))]);

        return $next($request);
    }

    /**
     * @return list<string>
     */
    private function extractHosts(Request $request): array
    {
        $hosts = [
            $request->getHost(),
            $request->getHttpHost(),
        ];

        foreach (['Origin', 'Referer'] as $header) {
            $url = $request->headers->get($header);
            if (! $url) {
                continue;
            }

            $parsed = parse_url($url);
            if (! isset($parsed['host'])) {
                continue;
            }

            $hosts[] = $parsed['host'];
            $hosts[] = $parsed['host'].(isset($parsed['port']) ? ':'.$parsed['port'] : '');
        }

        return $hosts;
    }
}
