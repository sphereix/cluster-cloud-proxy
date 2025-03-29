vcl 4.1;

backend default {
    .host = "nginx";
    .port = "80";
    .probe = {
        .url = "/health";
        .timeout = 2s;
        .interval = 5s;
        .window = 5;
        .threshold = 3;
    }
}

# Import site-specific configurations
include "sites/*.vcl";

sub vcl_recv {
    # Get the site configuration based on the host header
    call site_config;

    # Only cache GET and HEAD requests
    if (req.method != "GET" && req.method != "HEAD") {
        return(pass);
    }

    # Don't cache authenticated content
    if (req.http.Authorization) {
        return(pass);
    }

    # Check if caching is enabled for this site
    if (!req.http.X-Cache-Enabled) {
        return(pass);
    }

    return(hash);
}

sub vcl_backend_response {
    # Get TTL from site configuration
    if (beresp.http.X-Cache-TTL) {
        set beresp.ttl = std.duration(beresp.http.X-Cache-TTL + "s", 1h);
    } else {
        set beresp.ttl = 1h; # Default TTL
    }

    # Get grace period from site configuration
    if (beresp.http.X-Cache-Grace) {
        set beresp.grace = std.duration(beresp.http.X-Cache-Grace + "s", 1h);
    } else {
        set beresp.grace = 1h; # Default grace period
    }

    # Don't cache server errors
    if (beresp.status >= 500) {
        set beresp.uncacheable = true;
        return(deliver);
    }

    # Add cache headers for debugging
    set beresp.http.X-Cache-TTL = beresp.ttl;
    set beresp.http.X-Cache-Grace = beresp.grace;

    return(deliver);
}

sub vcl_deliver {
    # Add cache status headers
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
        set resp.http.X-Cache-Hits = obj.hits;
    } else {
        set resp.http.X-Cache = "MISS";
    }

    # Add timing information
    set resp.http.X-Cache-TTL = obj.ttl;
    set resp.http.X-Cache-Grace = obj.grace;

    return(deliver);
}