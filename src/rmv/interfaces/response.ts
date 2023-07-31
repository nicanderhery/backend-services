export interface RmvResponse {
    Trip: {
        Origin: {
            date: string;
            time: string;
        };
        Destination: {
            date: string;
            time: string;
        };
        LegList: {
            Leg: {
                Origin: {
                    date: string;
                    time: string;
                    extId: number;
                };
                Destination: {
                    date: string;
                    time: string;
                    extId: number;
                };
                name: string;
            }[];
        };
    }[];
}
