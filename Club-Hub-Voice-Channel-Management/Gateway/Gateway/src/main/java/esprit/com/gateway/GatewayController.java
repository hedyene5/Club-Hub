package esprit.com.gateway;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Collections;
import java.util.Enumeration;

@RestController
public class GatewayController {

    private final RestTemplate restTemplate = new RestTemplate();

    // Route vers User Service (port 8081)
    @RequestMapping(value = {"/api/auth/**", "/api/users/**", "/api/roles/**", "/api/permissions/**"}, method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<?> proxyToUserService(HttpServletRequest request, @RequestBody(required = false) String body) {
        return proxyRequest("http://localhost:8081", request, body);
    }

    // Route vers Club Service (port 8083)
    @RequestMapping(value = {"/api/clubs/**", "/api/elections/**"}, method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<?> proxyToClubService(HttpServletRequest request, @RequestBody(required = false) String body) {
        return proxyRequest("http://localhost:8083", request, body);
    }

    private ResponseEntity<?> proxyRequest(String targetUrl, HttpServletRequest request, String body) {
        try {
            String path = request.getRequestURI();
            String queryString = request.getQueryString();
            String fullUrl = targetUrl + path + (queryString != null ? "?" + queryString : "");

            HttpHeaders headers = new HttpHeaders();
            Enumeration<String> headerNames = request.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                if (!headerName.equalsIgnoreCase("host")) {
                    headers.put(headerName, Collections.list(request.getHeaders(headerName)));
                }
            }

            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            HttpMethod method = HttpMethod.valueOf(request.getMethod());

            ResponseEntity<String> response = restTemplate.exchange(
                    URI.create(fullUrl),
                    method,
                    entity,
                    String.class
            );

            return ResponseEntity
                    .status(response.getStatusCode())
                    .headers(response.getHeaders())
                    .body(response.getBody());

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            return ResponseEntity
                    .status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Gateway Error: " + e.getMessage());
        }
    }
}
