import {Header} from "../../../components";
import {ComboBoxComponent} from "@syncfusion/ej2-react-dropdowns";
import type { Route } from './+types/create-trip'
import {comboBoxItems, selectItems} from "~/constants";
import {cn, formatKey} from "~/lib/utils";
import {LayerDirective, LayersDirective, MapsComponent} from "@syncfusion/ej2-react-maps";
import React, {useState} from "react";
import {world_map} from "~/constants/world_map";
import {ButtonComponent} from "@syncfusion/ej2-react-buttons";
import {account} from "~/appwrite/client";
import {useNavigate} from "react-router";

export const loader = async () => {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error("Expected an array of countries, but received:", data);
            return [
                { name: "🇺🇸 United States", coordinates: [38.0, -97.0], value: "United States" },
                { name: "🇮🇳 India", coordinates: [20.0, 77.0], value: "India" },
                { name: "🇫🇷 France", coordinates: [46.0, 2.0], value: "France" },
                { name: "🇯🇵 Japan", coordinates: [36.0, 138.0], value: "Japan" },
                { name: "🇮🇹 Italy", coordinates: [42.83333333, 12.83333333], value: "Italy" },
                { name: "🇬🇧 United Kingdom", coordinates: [54.0, -2.0], value: "United Kingdom" },
                { name: "🇦🇺 Australia", coordinates: [-27.0, 133.0], value: "Australia" },
                { name: "🇧🇷 Brazil", coordinates: [-10.0, -55.0], value: "Brazil" },
                { name: "🇿🇦 South Africa", coordinates: [-29.0, 24.0], value: "South Africa" }
            ];
        }

        return data.map((country: any) => ({
            name: country.flag ? country.flag + " " + country.name.common : country.name.common,
            coordinates: country.latlng,
            value: country.name.common,
            openStreetMap: country.maps?.openStreetMap,
        }))
    } catch (e) {
        console.error("Failed to fetch countries:", e);
        return [
            { name: "🇺🇸 United States", coordinates: [38.0, -97.0], value: "United States" },
            { name: "🇮🇳 India", coordinates: [20.0, 77.0], value: "India" },
            { name: "🇫🇷 France", coordinates: [46.0, 2.0], value: "France" },
            { name: "🇯🇵 Japan", coordinates: [36.0, 138.0], value: "Japan" },
            { name: "🇮🇹 Italy", coordinates: [42.83333333, 12.83333333], value: "Italy" },
            { name: "🇬🇧 United Kingdom", coordinates: [54.0, -2.0], value: "United Kingdom" },
            { name: "🇦🇺 Australia", coordinates: [-27.0, 133.0], value: "Australia" },
            { name: "🇧🇷 Brazil", coordinates: [-10.0, -55.0], value: "Brazil" },
            { name: "🇿🇦 South Africa", coordinates: [-29.0, 24.0], value: "South Africa" }
        ];
    }
}

const CreateTrip = ({ loaderData }: Route.ComponentProps ) => {
    const countries = loaderData as Country[];
    const navigate = useNavigate();

    const [formData, setFormData] = useState<TripFormData>({
        country: countries[0]?.name || '',
        travelStyle: '',
        interest: '',
        budget: '',
        duration: 0,
        groupType: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
       e.preventDefault()
        setLoading(true);

       if(
           !formData.country ||
           !formData.travelStyle ||
           !formData.interest ||
           !formData.budget ||
           !formData.groupType
       ) {
           setError('Please provide values for all fields');
           setLoading(false)
           return;
       }

       if(formData.duration < 1 || formData.duration > 10) {
           setError('Duration must be between 1 and 10 days');
           setLoading(false)
           return;
       }
       const user = await account.get();
       if(!user.$id) {
           console.error('User not authenticated');
           setLoading(false)
           return;
       }

        try {
           const response = await fetch('/api/create-trip', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json'},
               body: JSON.stringify({
                   country: formData.country,
                   numberOfDays: formData.duration,
                   travelStyle: formData.travelStyle,
                   interests: formData.interest,
                   budget: formData.budget,
                   groupType: formData.groupType,
                   userId: user.$id
               })
           })

           const result = await response.json();

           if(result?.id) {
               navigate(`/trips/${result.id}`);
           } else {
               setError(result?.error || 'Failed to generate a trip');
           }
       } catch (e: any) {
           setError(e.message || 'An unexpected error occurred');
           console.error('Error generating trip', e);
       } finally {
           setLoading(false)
       }
    };

    const handleChange = (key: keyof TripFormData, value: string | number)  => {
    setFormData({ ...formData, [key]: value})
    }
    const countryData = countries.map((country) => ({
        text: country.name,
        value: country.value,
    }))

    const mapData = [
        {
            country: formData.country,
            color: '#EA382E',
            coordinates: countries.find((c: Country) => c.name === formData.country)?.coordinates || []
        }
    ]

    return (
        <main className="flex flex-col gap-10 pb-20 wrapper">
            <Header title="Add a New Trip" description="View and edit AI Generated travel plans" />

            <section className="mt-2.5 wrapper-md">
                <form className="trip-form" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="country">
                            Country
                        </label>
                        <ComboBoxComponent
                            id="country"
                            dataSource={countryData}
                            fields={{ text: 'text', value: 'value' }}
                            placeholder="Select a Country"
                            className="combo-box"
                            change={(e: { value: string | undefined }) => {
                                if(e.value) {
                                    handleChange('country', e.value)
                                }
                            }}
                            allowFiltering
                            filtering={(e) => {
                                const query = e.text.toLowerCase();

                                e.updateData(
                                    countries.filter((country) => country.name.toLowerCase().includes(query)).map(((country) => ({
                                        text: country.name,
                                        value: country.value
                                    })))
                                )
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor="duration">Duration</label>
                        <input
                            id="duration"
                            name="duration"
                            type="number"
                            placeholder="Enter a number of days"
                            className="form-input placeholder:text-gray-100"
                            onChange={(e) => handleChange('duration', Number(e.target.value))}
                        />
                    </div>

                    {selectItems.map((key) => (
                        <div key={key}>
                            <label htmlFor={key}>{formatKey(key)}</label>

                            <ComboBoxComponent
                                id={key}
                                dataSource={comboBoxItems[key].map((item) => ({
                                    text: item,
                                    value: item,
                                }))}
                                fields={{ text: 'text', value: 'value'}}
                                placeholder={`Select ${formatKey(key)}`}
                                change={(e: { value: string | undefined }) => {
                                    if(e.value) {
                                        handleChange(key, e.value)
                                    }
                                }}
                                allowFiltering
                                filtering={(e) => {
                                    const query = e.text.toLowerCase();

                                    e.updateData(
                                        comboBoxItems[key]
                                            .filter((item) => item.toLowerCase().includes(query))
                                            .map(((item) => ({
                                                text: item,
                                                value: item,
                                            }))))}}
                                className="combo-box"
                            />
                        </div>
                    ))}

                    <div>
                        <label htmlFor="location">
                            Location on the world map
                        </label>
                        <MapsComponent>
                            <LayersDirective>
                                <LayerDirective
                                    shapeData={world_map}
                                    dataSource={mapData}
                                    shapePropertyPath="name"
                                    shapeDataPath="country"
                                    shapeSettings={{ colorValuePath: "color", fill: "#E5E5E5" }}
                                />
                            </LayersDirective>
                        </MapsComponent>
                    </div>

                    <div className="bg-gray-200 h-px w-full" />

                    {error && (
                        <div className="error">
                            <p>{error}</p>
                        </div>
                    )}
                    <footer className="px-6 w-full">
                        <ButtonComponent type="submit"
                            className="button-class !h-12 !w-full" disabled={loading}
                        >
                            <img src={`/assets/icons/${loading ? 'loader.svg' : 'magic-star.svg'}`} className={cn("size-5", {'animate-spin': loading})} />
                            <span className="p-16-semibold text-white">
                                {loading ? 'Generating...' : 'Generate Trip'}
                            </span>
                        </ButtonComponent>
                    </footer>
                </form>
            </section>
        </main>
    )
}
export default CreateTrip
