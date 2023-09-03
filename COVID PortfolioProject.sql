Select *
From PortfolioProject.dbo.CovidDeaths
Where continent is not null
order by 3,4

-- Select *
-- From PortfolioProject.dbo.CovidVaccinations
-- order by 3,4

-- Change data type in table
alter table CovidDeaths
alter COLUMN date DATE;

alter table CovidDeaths
alter COLUMN total_cases float;

alter table CovidDeaths
alter COLUMN total_deaths float;

Select Location, date, total_cases, new_cases, total_deaths, population
From PortfolioProject.dbo.CovidDeaths
Order by 1,2

-- Looking at Total Cases vs Total Deaths

Select continent, Location, date, total_cases, total_deaths, (total_deaths/total_cases)*100 as DeathPercentage
From PortfolioProject.dbo.CovidDeaths
Where location like '%state%' and continent is not null
Order by 1,2

-- Looking at Total Cases vs Population
-- Shows what percentage of population got covid

Select continent, Location, date, population, total_cases, (total_cases/population)*100 as DeathPercentage
From PortfolioProject.dbo.CovidDeaths
Where location like '%state%'
Order by 1,2

-- Looking at Country with Highest Infection Rate compared to Population
SELECT continent, Location, Population, MAX(total_cases) as HighestInfectionCount, MAX(total_cases/population)*100 as 
PercentPopulationInfected 
From PortfolioProject.dbo.CovidDeaths
--Where location like '%state%'
Where continent is not null
GROUP by continent, Location, population
Order by PercentPopulationInfected DESC


-- Shows Countries with Highest Death Count per Population
SELECT continent, location, MAX(cast(total_deaths as int)) as TotalDeathCount
From PortfolioProject.dbo.CovidDeaths
--Where location like '%state%'
Where continent is not null
Group by continent, location
Order by TotalDeathCount DESC


-- Let's Break things down by Continent
-- Showing continents with the highest death count per population

SELECT continent, MAX(cast(total_deaths as int)) as TotalDeathCount
From PortfolioProject.dbo.CovidDeaths
--Where location like '%state%'
Where continent is not null
GROUP by continent
Order by TotalDeathCount DESC

-- Global Numbers
Select date, SUM(cast(new_cases as float)) as total_cases, SUM(cast(new_deaths as float)) as total_deaths, 
SUM(cast(new_deaths as float))/SUM(cast(new_cases as float))*100 as DeathPercentage
From PortfolioProject.dbo.CovidDeaths
--Where location like '%state%' 
Where continent is not null
Group by date
Order by 1,2

Select SUM(cast(new_cases as float)) as total_cases, SUM(cast(new_deaths as float)) as total_deaths, 
SUM(cast(new_deaths as float))/SUM(cast(new_cases as float))*100 as DeathPercentage
From PortfolioProject.dbo.CovidDeaths
--Where location like '%state%' 
Where continent is not null
--Group by date
Order by 1,2


-- Looking at Total Population vs Vaccinations
alter table CovidVaccinations
alter COLUMN date DATE;

SELECT *
From PortfolioProject.dbo.CovidDeaths dea
JOIN PortfolioProject.dbo.CovidVaccinations vac
    On dea.location = vac.location 
    and dea.date = vac.date

SELECT dea.continent, dea.location, dea.date, dea.population, vac.new_vaccinations
From PortfolioProject.dbo.CovidDeaths dea
JOIN PortfolioProject.dbo.CovidVaccinations vac
    On dea.location = vac.location 
    and dea.date = vac.date
Where dea.continent is not null
Order by 2, 3

SELECT dea.continent, dea.location, dea.date, dea.population, vac.new_vaccinations
, SUM(CONVERT(int,vac.new_vaccinations)) OVER (Partition by dea.location Order by 
cast(dea.location as nvarchar(30)), dea.date) as RollingPeopleVaccinated
--, (RollingPeopleVaccinated/population)*100
From PortfolioProject.dbo.CovidDeaths dea
JOIN PortfolioProject.dbo.CovidVaccinations vac
    On dea.location = vac.location 
    and dea.date = vac.date
Where dea.continent is not null
Order by 2, 3

-- USE CTE

With PopvsVac (Continent, Location, Date, Population, New_Vaccinations, RollingPeopleVaccinated)
as 
(
SELECT dea.continent, dea.location, dea.date, dea.population, vac.new_vaccinations
, SUM(CONVERT(int,vac.new_vaccinations)) OVER (Partition by dea.location Order by 
cast(dea.location as nvarchar(30)), dea.date) as RollingPeopleVaccinated
--, (RollingPeopleVaccinated/population)*100
From PortfolioProject.dbo.CovidDeaths dea
JOIN PortfolioProject.dbo.CovidVaccinations vac
    On dea.location = vac.location 
    and dea.date = vac.date
Where dea.continent is not null
--Order by 2, 3
)

SELECT *, (RollingPeopleVaccinated/population)*100
From PopvsVac

-- Temp Table

Drop table if exists #PercentPopulationVaccinated
Create Table #PercentPopulationVaccinated
(
    Continent nvarchar (255),
    Location nvarchar (255),
    Date DATETIME,
    Population NUMERIC,
    New_Vaccinations NUMERIC,
    RollingPeopleVaccinated NUMERIC
)

Insert into #PercentPopulationVaccinated
SELECT dea.continent, dea.location, dea.date, dea.population, vac.new_vaccinations
, SUM(CONVERT(int,vac.new_vaccinations)) OVER (Partition by dea.location Order by 
cast(dea.location as nvarchar(30)), dea.date) as RollingPeopleVaccinated
--, (RollingPeopleVaccinated/population)*100
From PortfolioProject.dbo.CovidDeaths dea
JOIN PortfolioProject.dbo.CovidVaccinations vac
    On dea.location = vac.location 
    and dea.date = vac.date
--Where dea.continent is not null
--Order by 2, 3

Select *, (RollingPeopleVaccinated/Population)*100
From #PercentPopulationVaccinated

-- Creating View to store data for later visualization

Create View PercentPopulationVaccinated as
SELECT dea.continent, dea.location, dea.date, dea.population, vac.new_vaccinations
, SUM(CONVERT(int,vac.new_vaccinations)) OVER (Partition by dea.location Order by 
cast(dea.location as nvarchar(30)), dea.date) as RollingPeopleVaccinated
--, (RollingPeopleVaccinated/population)*100
From PortfolioProject.dbo.CovidDeaths dea
JOIN PortfolioProject.dbo.CovidVaccinations vac
    On dea.location = vac.location 
    and dea.date = vac.date
Where dea.continent is not null
--Order by 2, 3




