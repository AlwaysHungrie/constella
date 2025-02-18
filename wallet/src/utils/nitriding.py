import urllib.request

def signal_ready(nitriding_url):
    """Signal the TEE that the API is ready"""
    print("🔑 signal_ready", nitriding_url)
    r = urllib.request.urlopen(nitriding_url + "/ready")
    if r.getcode() != 200:
        raise Exception(
            "Expected status code %d but got %d"
            % (r.status_codes.codes.ok, r.status_code)
        ) 