from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time


# --------------------------------------------------------
# Common Driver Setup
# --------------------------------------------------------
def get_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Run without UI
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(10)
    return driver


# --------------------------------------------------------
# ZOOMCAR SCRAPER — Home Carousel Only
# --------------------------------------------------------
def scrape_zoomcar(city: str, limit: int = 5):
    driver = get_driver()
    url = f"https://www.zoomcar.com/in/{city.lower()}"
    driver.get(url)

    listings = []

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located(
                (By.CLASS_NAME, "home-carousel-container-carousel-element")
            )
        )
        time.sleep(3)

        car_cards = driver.find_elements(
            By.CLASS_NAME, "home-carousel-container-carousel-element"
        )
        print(f"🟢 Zoomcar: Found {len(car_cards)} carousel items")

        for i, card in enumerate(car_cards[:limit]):
            try:
                name_el = card.find_element(
                    By.CLASS_NAME, "car-item-search-container-info-container"
                )
                price_el = card.find_element(
                    By.CLASS_NAME, "car-item-search-container-price"
                )

                car_name = name_el.text.strip()
                price = price_el.text.strip()

                if car_name and price:
                    listings.append({
                        "site": "Zoomcar",
                        "vehicle_name": car_name,
                        "price_per_day": price,
                    })
                    print(f"✅ Zoomcar: {car_name} — {price}")

            except Exception as e:
                print(f"⚠️ Zoomcar card {i+1}: {e}")
                continue

    except Exception as e:
        print(f"❌ Zoomcar error: {e}")

    driver.quit()
    return listings


# --------------------------------------------------------
# REVV SCRAPER
# --------------------------------------------------------
def scrape_revv(city: str, limit: int = 5):
    driver = get_driver()
    url = f"https://www.revv.co.in/cars/in/{city.lower()}"
    driver.get(url)

    listings = []

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "car-box"))
        )
        time.sleep(3)

        car_cards = driver.find_elements(By.CLASS_NAME, "car-box")
        print(f"🟢 Revv: Found {len(car_cards)} listings")

        for i, card in enumerate(car_cards[:limit]):
            try:
                name = card.find_element(By.CSS_SELECTOR, ".car-title").text
                price = card.find_element(By.CSS_SELECTOR, ".fare").text

                listings.append({
                    "site": "Revv",
                    "vehicle_name": name,
                    "price_per_day": price,
                })
                print(f"✅ Revv: {name} — {price}")

            except Exception as e:
                print(f"⚠️ Revv card {i+1}: {e}")
                continue

    except Exception as e:
        print(f"❌ Revv error: {e}")

    driver.quit()
    return listings


# --------------------------------------------------------
# DRIVEZY SCRAPER
# --------------------------------------------------------
def scrape_drivezy(city: str, limit: int = 5):
    driver = get_driver()
    url = f"https://www.drivezy.com/in/{city.lower()}"
    driver.get(url)

    listings = []

    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_all_elements_located((By.CLASS_NAME, "vehicle-card"))
        )
        time.sleep(3)

        car_cards = driver.find_elements(By.CLASS_NAME, "vehicle-card")
        print(f"🟢 Drivezy: Found {len(car_cards)} listings")

        for i, card in enumerate(car_cards[:limit]):
            try:
                name = card.find_element(By.CSS_SELECTOR, ".vehicle-title").text
                price = card.find_element(By.CSS_SELECTOR, ".cost").text

                listings.append({
                    "site": "Drivezy",
                    "vehicle_name": name,
                    "price_per_day": price,
                })
                print(f"✅ Drivezy: {name} — {price}")

            except Exception as e:
                print(f"⚠️ Drivezy card {i+1}: {e}")
                continue

    except Exception as e:
        print(f"❌ Drivezy error: {e}")

    driver.quit()
    return listings


# --------------------------------------------------------
# COMBINE ALL SCRAPERS
# --------------------------------------------------------
def scrape_all_sources(city: str):
    combined = []
    print(f"🔍 Starting scrape for city: {city}\n")

    for scraper in [scrape_zoomcar, scrape_revv, scrape_drivezy]:
        try:
            data = scraper(city, limit=5)
            combined.extend(data)
        except Exception as e:
            print(f"⚠️ Error in {scraper.__name__}: {e}")

    print(f"\n🔹 Total listings scraped: {len(combined)}")
    return combined


# --------------------------------------------------------
# MAIN TEST RUN
# --------------------------------------------------------
if __name__ == "__main__":
    city = "Bangalore"
    results = scrape_all_sources(city)

    print(f"\n✅ Scraped {len(results)} total listings\n")
    for r in results:
        print(f"{r['site']}: {r['vehicle_name']} — {r['price_per_day']}")
