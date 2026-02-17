import requests
import sys

def test_connection(name, url):
    print(f"Testing {name} ({url})...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"✅ {name} responded successfully.")
            return True
        else:
            print(f"❌ {name} returned status code {response.status_code}.")
            return False
    except Exception as e:
        print(f"❌ {name} failed: {str(e)}")
        return False

if __name__ == "__main__":
    sources = [
        ("Reddit", "https://www.reddit.com/r/ArtificialIntelligence/top.json?t=day"),
        ("Ben's Bites", "https://www.bensbites.com/archive"),
        ("AI Rundown", "https://www.therundown.ai/archive")
    ]
    
    results = [test_connection(name, url) for name, url in sources]
    
    if all(results):
        print("\nAll links verified. Ready for architecture phase.")
        sys.exit(0)
    else:
        print("\nSome links failed. Check findings.md for details.")
        sys.exit(1)
