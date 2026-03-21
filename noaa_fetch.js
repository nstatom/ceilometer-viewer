export default {
  async fetch(request) {

    const url = new URL(request.url)

    const station = (url.searchParams.get("station") || "KSAN").toUpperCase()
    const hours = Math.min(parseInt(url.searchParams.get("hours") || "24"), 168)

    // NOAA Aviation Weather API
    const apiURL =
      `https://aviationweather.gov/api/data/metar?ids=${station}&hours=${hours}&format=json`

    try {
      const res = await fetch(apiURL)
      const data = await res.json()

      // parse cloud layers
      const parsed = data.map(m => {

        let clouds = []

        if (m.clouds) {
          clouds = m.clouds.map(c => ({
            cover: c.cover,     // FEW, SCT, BKN, OVC
            base: c.base        // feet AGL
          }))
        }

        return {
          time: m.obsTime,
          raw: m.rawOb,
          clouds: clouds,
          visibility: m.visib,
          temp: m.temp,
          dewpoint: m.dewp
        }
      })

      return new Response(JSON.stringify({
        station: station,
        count: parsed.length,
        data: parsed
      }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      })

    } catch (err) {
      return new Response(JSON.stringify({
        error: "Failed to fetch METAR data",
        details: err.toString()
      }), { status: 500 })
    }
  }
}