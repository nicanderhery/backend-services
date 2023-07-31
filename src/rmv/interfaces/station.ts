export interface Station {
    hafasId: number;
    rmvId: number;
    dhId: string;
    hstName: string;
    nameFahrPlan: string;
    xIplWert: number;
    yIplWert: number;
    xWgs84: number;
    yWgs84: number;
    lno: string;
    istBahnhof: number;
    gueltigAb: string;
    gueltigBis: string;
    verbund1IstGleichRmv: number;
    land: string;
    rp: string;
    landKreis: string;
    gemeindeName: string;
    ortsTeilName: string;
    agsLand: number;
    agsRp: number;
    agsLk: number;
    agsG: number;
    agsOt: number;
}
