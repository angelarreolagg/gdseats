import type { Team } from '../types/team.types'

/**
 * 24 franchises — 8 per page gives the "1 of 3" pagination from the reference.
 * Colours are the franchise's own and drive the generated card artwork; there are
 * no image assets in this demo.
 */
export const TEAMS: Team[] = [
  { id: 'dal', name: 'Dallas Cowboys', venue: 'AT&T Stadium', primary: '#041E42', secondary: '#869397', basePricePerSeat: 11_500, demandIndex: 0.95 },
  { id: 'sf', name: 'San Francisco 49ers', venue: "Levi's Stadium", primary: '#AA0000', secondary: '#B3995D', basePricePerSeat: 10_200, demandIndex: 0.82 },
  { id: 'lv', name: 'Las Vegas Raiders', venue: 'Allegiant Stadium', primary: '#0B0B0B', secondary: '#A5ACAF', basePricePerSeat: 10_800, demandIndex: 0.9 },
  { id: 'min', name: 'Minnesota Vikings', venue: 'U.S. Bank Stadium', primary: '#4F2683', secondary: '#FFC62F', basePricePerSeat: 8_600, demandIndex: 0.76 },
  { id: 'bal', name: 'Baltimore Ravens', venue: 'M&T Bank Stadium', primary: '#241773', secondary: '#9E7C0C', basePricePerSeat: 8_100, demandIndex: 0.79 },
  { id: 'car', name: 'Carolina Panthers', venue: 'Bank of America Stadium', primary: '#0085CA', secondary: '#101820', basePricePerSeat: 6_900, demandIndex: 0.61 },
  { id: 'atl', name: 'Atlanta Falcons', venue: 'Mercedes-Benz Stadium', primary: '#A71930', secondary: '#101820', basePricePerSeat: 7_400, demandIndex: 0.7 },
  { id: 'hou', name: 'Houston Texans', venue: 'Reliant Stadium', primary: '#03202F', secondary: '#A71930', basePricePerSeat: 7_600, demandIndex: 0.68 },

  { id: 'lar', name: 'Los Angeles Rams', venue: 'SoFi Stadium', primary: '#003594', secondary: '#FFA300', basePricePerSeat: 12_400, demandIndex: 0.88 },
  { id: 'nyg', name: 'New York Giants', venue: 'MetLife Stadium', primary: '#0B2265', secondary: '#A71930', basePricePerSeat: 9_300, demandIndex: 0.8 },
  { id: 'sea', name: 'Seattle Seahawks', venue: 'Lumen Field', primary: '#002244', secondary: '#69BE28', basePricePerSeat: 8_900, demandIndex: 0.86 },
  { id: 'gb', name: 'Green Bay Packers', venue: 'Lambeau Field', primary: '#203731', secondary: '#FFB612', basePricePerSeat: 9_800, demandIndex: 0.93 },
  { id: 'phi', name: 'Philadelphia Eagles', venue: 'Lincoln Financial Field', primary: '#004C54', secondary: '#A5ACAF', basePricePerSeat: 9_100, demandIndex: 0.87 },
  { id: 'kc', name: 'Kansas City Chiefs', venue: 'Arrowhead Stadium', primary: '#E31837', secondary: '#FFB81C', basePricePerSeat: 10_400, demandIndex: 0.94 },
  { id: 'den', name: 'Denver Broncos', venue: 'Empower Field', primary: '#FB4F14', secondary: '#002244', basePricePerSeat: 7_800, demandIndex: 0.74 },
  { id: 'lac', name: 'Los Angeles Chargers', venue: 'SoFi Stadium', primary: '#0080C6', secondary: '#FFC20E', basePricePerSeat: 6_500, demandIndex: 0.62 },

  { id: 'nyj', name: 'New York Jets', venue: 'MetLife Stadium', primary: '#125740', secondary: '#FFFFFF', basePricePerSeat: 6_200, demandIndex: 0.58 },
  { id: 'buf', name: 'Buffalo Bills', venue: 'Highmark Stadium', primary: '#00338D', secondary: '#C60C30', basePricePerSeat: 7_100, demandIndex: 0.84 },
  { id: 'mia', name: 'Miami Dolphins', venue: 'Hard Rock Stadium', primary: '#008E97', secondary: '#FC4C02', basePricePerSeat: 8_300, demandIndex: 0.77 },
  { id: 'chi', name: 'Chicago Bears', venue: 'Soldier Field', primary: '#0B162A', secondary: '#C83803', basePricePerSeat: 7_900, demandIndex: 0.81 },
  { id: 'ne', name: 'New England Patriots', venue: 'Gillette Stadium', primary: '#002244', secondary: '#C60C30', basePricePerSeat: 8_700, demandIndex: 0.83 },
  { id: 'ten', name: 'Tennessee Titans', venue: 'Nissan Stadium', primary: '#0C2340', secondary: '#4B92DB', basePricePerSeat: 6_100, demandIndex: 0.6 },
  { id: 'ari', name: 'Arizona Cardinals', venue: 'State Farm Stadium', primary: '#97233F', secondary: '#000000', basePricePerSeat: 6_700, demandIndex: 0.64 },
  { id: 'jax', name: 'Jacksonville Jaguars', venue: 'EverBank Stadium', primary: '#101820', secondary: '#D7A22A', basePricePerSeat: 5_800, demandIndex: 0.55 },
]

export const TEAMS_PER_PAGE = 8

export function getTeamById(teamId: string): Team | undefined {
  return TEAMS.find((team) => team.id === teamId)
}
